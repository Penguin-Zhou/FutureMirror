"""v67 · AI 小助手的服务端部分：限流 + 提示词装配。

两件事原本都在前端做，搬过来是因为它们属于「服务端才守得住」的约束：

1) **限流**。小助手现在允许未登录访客直接调用真实模型（否则评委在落地页
   试一句就得先注册），额度就成了公共资源。前端限流改一行 JS 就能绕过，
   所以窗口必须落在服务端。

2) **提示词**。检索结果与引用编号必须和实际喂给模型的内容一致——
   让前端自己拼「参考资料」，它就可以拼一份、发另一份，回答里的 [1][2]
   与界面上列出的引用也会对不上。

限流最初是**进程内内存**的滑动窗口，本地单进程跑得好好的；上线后实测发现
镜像站会起多个工作进程，每个进程各记一份账——5 个并发请求只扣了 2 次额度，
匿名上限被放大到「6 × 进程数」。所以记账改成落库（见 `DbRateLimiter`），
多进程共用同一份。内存版保留下来：一是单测要能脱离数据库验证窗口逻辑，
二是库写失败时的兜底（宁可退化成单进程限额，也不要直接放行）。
不引入 Redis 的原因不变：这个部署形态里没有 Redis。
"""
from __future__ import annotations

import re
import threading
import time
from collections import deque
from typing import Any

SYSTEM_PROMPT = (
    "你是「面镜 FutureMirror」的 AI 小助手，服务对象是正在准备求职面试的学生。\n"
    "回答要求：\n"
    "1. 用简洁中文，先给结论再给要点，不要客套和重复问题；\n"
    "2. 优先依据【参考资料】作答，并在用到某条资料时用 [1][2] 标注编号；\n"
    "3. 资料没覆盖的部分要明确说「资料里没有」，再给出你自己的通用建议，"
    "不要把推测说成资料内容；\n"
    "4. 遇到与平台功能有关的问题（怎么模拟面试、题库怎么用、报告怎么看），"
    "直接给操作路径；\n"
    "5. 不编造任何分数、公司名或用户评价。"
)

# 访客与登录用户分开定额：登录用户有账号可追溯，可以放宽；
# 访客只能按来源地址算，必须收紧。
QUOTA_ANON = {"per_min": 6, "per_day": 40}
QUOTA_USER = {"per_min": 12, "per_day": 200}
_MIN_WINDOW = 60.0
_DAY_WINDOW = 86400.0


class RateLimiter:
    """滑动窗口限流。key 由调用方决定（访客按来源地址，登录按用户 id）。

    只保留窗口内的命中时间戳：一天最多 200 条记录/主体，
    内存占用可以忽略；也不需要清理线程。
    """

    def __init__(self, per_min: int, per_day: int) -> None:
        self.per_min = per_min
        self.per_day = per_day
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str, now: float | None = None) -> tuple[bool, dict[str, Any]]:
        """返回 (是否放行, 说明)。放行时已记账，调用方不必再记一次。"""
        t = time.monotonic() if now is None else now
        with self._lock:
            q = self._hits.get(key)
            if q is None:
                q = deque()
                self._hits[key] = q
            # 丢掉一天以前的记录
            while q and t - q[0] > _DAY_WINDOW:
                q.popleft()
            in_min = sum(1 for x in q if t - x <= _MIN_WINDOW)
            if in_min >= self.per_min:
                oldest = next(x for x in q if t - x <= _MIN_WINDOW)
                return False, {
                    "scope": "minute",
                    "limit": self.per_min,
                    "retry_after": max(1, int(_MIN_WINDOW - (t - oldest)) + 1),
                    "remain": 0,
                }
            if len(q) >= self.per_day:
                return False, {
                    "scope": "day",
                    "limit": self.per_day,
                    "retry_after": max(1, int(_DAY_WINDOW - (t - q[0])) + 1),
                    "remain": 0,
                }
            q.append(t)
            return True, {"remain": max(0, self.per_min - in_min - 1), "limit": self.per_min}

    def reset(self) -> None:
        """测试用：清空所有记账。"""
        with self._lock:
            self._hits.clear()

    def size(self) -> int:
        with self._lock:
            return len(self._hits)


class DbRateLimiter:
    """跨进程滑动窗口：命中时间戳落库，多个工作进程共用一份账。

    接口与 `RateLimiter` 完全一致（check/reset/size），差别只在存储和时钟：
    时钟换成 `time.time()` 的可比时间戳，因为别的进程看不到本进程的 monotonic。

    并发下的精度：两条线程/进程可能同时读到「还剩 1 次」再各自写入，
    于是多放过去一次。限额是防滥用不是计费，容忍这种毫秒级竞态；
    真正要严的地方（防刷）得靠网关，这里只保证「大致按 6 次/分」。
    """

    def __init__(self, per_min: int, per_day: int) -> None:
        self.per_min = per_min
        self.per_day = per_day
        # 库不可用时的兜底：退化成单进程限额，总比完全不拦好
        self._fallback = RateLimiter(per_min, per_day)
        self._fallback_used = 0

    def check(self, key: str, now: float | None = None) -> tuple[bool, dict[str, Any]]:
        t = time.time() if now is None else now
        try:
            from .db import RateHit, SessionLocal
        except Exception:  # noqa: BLE001 - 没有库层就用内存版
            return self._fallback.check(key, now=t)
        try:
            with SessionLocal() as s:
                # 顺手清掉一天以前的记录：表很小，每次扫一遍比养清理线程简单
                s.query(RateHit).filter(RateHit.ts < t - _DAY_WINDOW).delete(
                    synchronize_session=False)
                stamps = [r[0] for r in s.query(RateHit.ts)
                          .filter(RateHit.key == key, RateHit.ts > t - _DAY_WINDOW)
                          .all()]
                in_min = [x for x in stamps if t - x <= _MIN_WINDOW]
                if len(in_min) >= self.per_min:
                    s.rollback()
                    return False, {
                        "scope": "minute",
                        "limit": self.per_min,
                        "retry_after": max(1, int(_MIN_WINDOW - (t - min(in_min))) + 1),
                        "remain": 0,
                    }
                if len(stamps) >= self.per_day:
                    s.rollback()
                    return False, {
                        "scope": "day",
                        "limit": self.per_day,
                        "retry_after": max(1, int(_DAY_WINDOW - (t - min(stamps))) + 1),
                        "remain": 0,
                    }
                s.add(RateHit(key=key, ts=t))
                s.commit()
                return True, {
                    "remain": max(0, self.per_min - len(in_min) - 1),
                    "limit": self.per_min,
                }
        except Exception:  # noqa: BLE001 - 库写失败不能把功能打成 500
            self._fallback_used += 1
            return self._fallback.check(key, now=t)

    def reset(self) -> None:
        """测试用：清空记账。"""
        self._fallback.reset()
        self._fallback_used = 0
        try:
            from .db import RateHit, SessionLocal
        except Exception:  # noqa: BLE001
            return
        try:
            with SessionLocal() as s:
                s.query(RateHit).delete(synchronize_session=False)
                s.commit()
        except Exception:  # noqa: BLE001
            pass

    def size(self) -> int:
        """当前记账的主体数。"""
        try:
            from .db import RateHit, SessionLocal
            with SessionLocal() as s:
                return len({r[0] for r in s.query(RateHit.key).all()})
        except Exception:  # noqa: BLE001
            return self._fallback.size()


anon_limiter = DbRateLimiter(QUOTA_ANON["per_min"], QUOTA_ANON["per_day"])
user_limiter = DbRateLimiter(QUOTA_USER["per_min"], QUOTA_USER["per_day"])


_ANON_ID_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")

# 所有「没有设备标识」的匿名调用共用一个主体。
# 这是刻意的：宁可让它们共用一份额度，也不要因为认不出人而人人一份。
SHARED_KEY = "a:shared"


def client_key(request: Any, user: Any = None) -> str:
    """限流主体：登录按账号，访客按前端生成的设备标识。

    为什么不按来源地址：镜像站前面是一层会换出口 IP 的代理池，
    实测连发 5 个请求拿到 4 个不同网段（43.143 / 82.156 / 82.157 / 49.233），
    `X-Real-IP` 与 `X-Forwarded-For` 首段都跟着变——按地址计额等于没计额
    （线上 10 个并发被记成 10 个 key，额度一次都没扣住）。

    所以身份由前端生成：`X-Anon-Id` 是 localStorage 里的随机串，随请求带上。
    它不是身份凭证（清掉 localStorage 就换一个），作用只是让**同一个浏览器**
    共用一份额度，挡住误触连点与顺手写脚本的人；真正的账号额度仍按用户 id 计。
    """
    if user is not None:
        return f"u:{getattr(user, 'id', '?')}"
    try:
        anon = (request.headers.get("x-anon-id") or "").strip()
        if _ANON_ID_RE.match(anon):
            return f"a:{anon}"
    except Exception:  # noqa: BLE001 - 取不到就当没有标识
        pass
    return SHARED_KEY


def proxy_shape(request: Any) -> dict[str, Any]:
    """请求身份的「形状」，不含具体值，供线上核验限流是否按预期聚合。

    `anon` 为真说明前端带上了设备标识；`xff_segments` / `real_ip` 记录下来
    是为了留证：这层代理的来源头对识别访客没有用（见 `client_key` 的说明）。
    """
    try:
        xff = request.headers.get("x-forwarded-for") or ""
        return {
            "anon": _ANON_ID_RE.match((request.headers.get("x-anon-id") or "").strip()) is not None,
            "xff_segments": len([s for s in xff.split(",") if s.strip()]) if xff else 0,
            "real_ip": bool(request.headers.get("x-real-ip")),
            "key": client_key(request)[:24],
        }
    except Exception:  # noqa: BLE001
        return {}


def rate_store_info() -> dict[str, Any]:
    """限额记账现在落在哪、有多少主体。

    存在的理由：限流从内存搬到库里之后，「到底有没有共用一份账」从外部看不见。
    线上排查时发现 10 个并发全过——是库没写进去（回落内存版），
    还是进程各有各的存储，只能靠这几个字段区分。所以把状态暴露在 /api/health。
    """
    fallbacks = getattr(anon_limiter, "_fallback_used", 0) + getattr(user_limiter, "_fallback_used", 0)
    try:
        from .db import RateHit, SessionLocal
        with SessionLocal() as s:
            keys = len({r[0] for r in s.query(RateHit.key).all()})
        return {"mode": "db", "db_ok": True, "keys": keys, "fallbacks": fallbacks}
    except Exception as e:  # noqa: BLE001
        return {"mode": "memory", "db_ok": False, "fallbacks": fallbacks,
                "error": str(e)[:80]}


def build_messages(question: str, hits: list[dict[str, Any]],
                   history: list[dict[str, str]] | None = None) -> list[dict[str, str]]:
    """拼 messages。参考资料与编号在这里生成，前端拿到的就是模型看到的那份。"""
    refs = []
    for i, h in enumerate(hits, 1):
        refs.append(f"[{i}]《{h.get('title', '')}》（{h.get('source', '')}）\n{h.get('content', '')}")
    ctx = "\n\n".join(refs) if refs else "（本次检索没有命中任何资料）"

    msgs: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in (history or [])[-6:]:
        role = m.get("role")
        content = str(m.get("content") or "")[:1500]
        if role in ("user", "assistant") and content:
            msgs.append({"role": role, "content": content})
    msgs.append({
        "role": "user",
        "content": f"【参考资料】\n{ctx}\n\n【用户问题】\n{question}",
    })
    return msgs


def citations_of(hits: list[dict[str, Any]]) -> list[dict[str, str]]:
    """下发给前端的引用元数据：只给标题与来源，不重复传正文（省一半流量）。"""
    return [{"title": h.get("title", ""), "source": h.get("source", "")} for h in hits]
