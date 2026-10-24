from __future__ import annotations

import json
import os
import pathlib
import secrets
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import asyncio
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

load_dotenv()

from .db import (Interview, Report, Turn, User, SessionLocal, get_db,  # noqa: E402
                 hash_password, init_db, verify_password)
from .llm import LLM_MODEL, llm_ready, sse_response                    # noqa: E402
from .scoring import score_session                                     # noqa: E402
from .enrich import enrich_report                                       # noqa: E402

def _resolve_secret_key() -> str:
    """JWT 签名密钥。

    早期版本在未配置时回退到硬编码常量，等于任何人都能伪造令牌——
    这里改为「未配置则进程启动时随机生成」：开发体验不变，
    生产漏配时最坏结果只是重启后旧令牌失效，而不是令牌可伪造。
    """
    key = (os.getenv("SECRET_KEY") or "").strip()
    if key:
        return key
    generated = secrets.token_urlsafe(48)
    print("[warn] SECRET_KEY 未设置，已随机生成临时密钥（进程重启后旧令牌失效）。"
          "生产环境请在 backend/.env 中显式配置。", file=sys.stderr)
    return generated


SECRET_KEY = _resolve_secret_key()


def _utcnow() -> datetime:
    """naive UTC 时间戳。

    datetime.utcnow() 在 Python 3.12+ 已弃用（3.13 起有 DeprecationWarning），
    这里改用带时区的 now() 再去掉 tzinfo，语义完全一致且无告警。
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
# 默认放开本地开发端口 + 两个在线演示域名（GitHub Pages / 国内镜像）；
# 部署时可用 CORS_ORIGINS 环境变量覆盖（allow_credentials=True 不能用 *，必须列名）
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,"
    "https://penguin-zhou.github.io,https://futuremirror-demo.app.workbuddy.host"
)
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",") if o.strip()]
TOKEN_TTL = timedelta(hours=12)

# 演示账号：与前端 CONFIG.testAccount 保持一致；启动时自动种子，
# 保证线上全新数据库开箱即可一键登录（demo 邮箱注册即 VIP，见 register）
DEMO_EMAIL = os.getenv("DEMO_EMAIL", "demo@futuremirror.app")
# 默认口令与前端 CONFIG.testAccount 保持一致，可通过环境变量覆盖（改了需同步前端）
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "Demo123456")


def _seed_demo_user() -> None:
    """lifespan 启动时确保演示账号存在（幂等，已存在则跳过）。"""
    db = SessionLocal()
    try:
        if not db.scalar(select(User).where(User.email == DEMO_EMAIL)):
            db.add(User(email=DEMO_EMAIL, name="演示用户",
                        password_hash=hash_password(DEMO_PASSWORD), is_vip=True))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    _seed_demo_user()
    yield


app = FastAPI(title="面镜 FutureMirror API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- 鉴权 ----------------
def make_token(user: User) -> str:
    return jwt.encode(
        {"sub": user.id, "exp": _utcnow() + TOKEN_TTL}, SECRET_KEY, algorithm="HS256"
    )


def current_user(authorization: str = Header(default=""),
                 x_auth_token: str = Header(default="", alias="X-Auth-Token"),
                 db: Session = Depends(get_db)) -> User:
    # 令牌优先取自 X-Auth-Token：公网托管平台的边缘网关会用自己的 JWT
    # 覆盖 Authorization 头（本地开发无网关，两种头都支持）。
    token = x_auth_token.strip() or (authorization[7:] if authorization.startswith("Bearer ") else "")
    if not token:
        raise HTTPException(401, "缺少访问令牌")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "令牌无效或已过期") from None
    user = db.get(User, payload["sub"])
    if not user:
        raise HTTPException(401, "用户不存在")
    return user


def user_payload(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "is_vip": user.is_vip}


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    email: EmailStr
    password: str = Field(min_length=6, max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(400, "该邮箱已注册")
    user = User(email=body.email, name=body.name,
                password_hash=hash_password(body.password),
                is_vip=body.email == DEMO_EMAIL)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": make_token(user), "user": user_payload(user)}


@app.post("/api/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "邮箱或密码不正确")
    return {"token": make_token(user), "user": user_payload(user)}


@app.get("/api/me")
def me(user: User = Depends(current_user)):
    return user_payload(user)


# ---------------- 健康检查（前端用它显示运行模式） ----------------
@app.get("/api/health")
def health():
    return {"ok": True, "llm_ready": llm_ready(), "model": LLM_MODEL if llm_ready() else None}


# ---------------- 大模型流式对话（Key 只在这一层） ----------------
class ChatIn(BaseModel):
    messages: list[dict]
    mode: str = "general"
    temperature: float | None = None


# 单条消息 / 整段会话的字符上限：既能挡住粘贴整本简历式的误用，
# 也能避免把上游按量计费的模型当成免费算力。
MAX_MESSAGE_CHARS = 4000
MAX_CONVERSATION_CHARS = 24000


@app.post("/api/chat/stream")
def chat_stream(body: ChatIn, user: User = Depends(current_user)):
    if not llm_ready():
        raise HTTPException(503, "服务端未配置 LLM_API_KEY，请使用 Mock 模式")
    if not body.messages or len(body.messages) > 40:
        raise HTTPException(400, "messages 数量异常")
    total = 0
    for m in body.messages:
        c = len(str(m.get("content") or ""))
        if c > MAX_MESSAGE_CHARS:
            raise HTTPException(400, f"单条消息过长（上限 {MAX_MESSAGE_CHARS} 字）")
        total += c
    if total > MAX_CONVERSATION_CHARS:
        raise HTTPException(400, f"会话上下文过长（上限 {MAX_CONVERSATION_CHARS} 字）")
    temp = body.temperature if body.temperature is not None else 0.6
    return sse_response(body.messages, temperature=max(0.0, min(1.2, temp)))


# ---------------- 面试会话持久化 ----------------
class CreateInterviewIn(BaseModel):
    mode: str = "general"
    job: str = ""


@app.post("/api/interviews")
def create_interview(body: CreateInterviewIn, user: User = Depends(current_user),
                     db: Session = Depends(get_db)):
    iv = Interview(user_id=user.id, mode=body.mode, job=body.job)
    db.add(iv)
    db.commit()
    db.refresh(iv)
    return {"id": iv.id}


class TurnIn(BaseModel):
    seq: int
    agent: str
    question: str
    answer: str
    notes: str = ""


class SyncTurnsIn(BaseModel):
    turns: list[TurnIn]


@app.post("/api/interviews/{interview_id}/sync")
def sync_turns(interview_id: str, body: SyncTurnsIn,
               user: User = Depends(current_user), db: Session = Depends(get_db)):
    """批量同步一轮会话的问答。

    v22.1：由「先删后插」改为按 seq 幂等去重——重复调用不产生脏数据，
    也不会因前端重试/刷新把已入库的轮次删掉重建。
    """
    iv = db.get(Interview, interview_id)
    if not iv or iv.user_id != user.id:
        raise HTTPException(404, "会话不存在")
    if len(body.turns) > 30:
        raise HTTPException(400, "单次同步轮次过多")
    existing = {t.seq for t in db.scalars(
        select(Turn).where(Turn.interview_id == interview_id)).all()}
    added = 0
    for item in body.turns:
        if item.seq in existing:
            continue
        db.add(Turn(interview_id=interview_id, **item.model_dump()))
        added += 1
    db.commit()
    return {"ok": True, "added": added, "total": len(body.turns)}


class ReportIn(BaseModel):
    match_score: int | None = None
    code_score: float | None = None
    match_gaps: list[str] = []


@app.post("/api/interviews/{interview_id}/report")
def gen_report(interview_id: str, body: ReportIn,
               user: User = Depends(current_user), db: Session = Depends(get_db)):
    iv = db.get(Interview, interview_id)
    if not iv or iv.user_id != user.id:
        raise HTTPException(404, "会话不存在")
    turns = db.scalars(select(Turn).where(Turn.interview_id == interview_id)
                       .order_by(Turn.seq)).all()
    if not turns:
        raise HTTPException(400, "该会话还没有问答记录")
    result = score_session([{"agent": t.agent, "question": t.question,
                             "answer": t.answer, "notes": t.notes,
                             "mode": iv.mode} for t in turns],
                           body.match_score, body.code_score, body.match_gaps)

    # v31.5：确定性评分之上，若服务端已配置 LLM，则叠加逐维质性点评与总评。
    # 分数始终由确定性引擎给出（可解释、不幻觉），LLM 只补文字层面的改进建议；
    # 任何异常或不可信结果都回退到规则评语，绝不影响主链路。
    enriched = None
    if llm_ready():
        try:
            enriched = enrich_report(
                result["dims"],
                [{"agent": t.agent, "question": t.question, "answer": t.answer}
                 for t in turns],
                {"match_score": body.match_score, "match_gaps": body.match_gaps}
                if body.match_score is not None else None,
            )
        except Exception:  # noqa: BLE001
            enriched = None
    if enriched:
        for d, c in zip(result["dims"], enriched["comments"]):
            d["comment"] = c
        if enriched.get("narrative"):
            result["narrative"] = enriched["narrative"]
        result["scoring"] = {"engine": "deterministic+llm", "llm_enriched": True}
    else:
        result["scoring"] = {"engine": "deterministic", "llm_enriched": False}

    old = db.scalar(select(Report).where(Report.interview_id == interview_id))
    if old:
        db.delete(old)
        db.commit()
    db.add(Report(interview_id=interview_id, total=result["total"],
                  dims_json=json.dumps(result["dims"], ensure_ascii=False),
                  plan_json=json.dumps({"plan": result["plan"],
                                        "evidence": result["evidence"]}, ensure_ascii=False)))
    iv.status = "finished"
    db.commit()
    return result


@app.get("/api/interviews")
def list_interviews(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Interview).where(Interview.user_id == user.id)
                      .order_by(Interview.created_at.desc()).limit(20)).all()
    out = []
    for r in rows:
        rep = db.scalar(select(Report).where(Report.interview_id == r.id))
        out.append({"id": r.id, "mode": r.mode, "job": r.job, "status": r.status,
                    "created_at": r.created_at.isoformat(),
                    "total": rep.total if rep else None})
    return out


# ---------------- 实时看板：聚合指标（REST + WebSocket 双通道） ----------------
# 只暴露全局聚合量（会话数 / 轮次数 / 平均分 / LLM 就绪），不含任何个人数据。
def _live_stats(db: Session) -> dict:
    interviews = db.scalar(select(func.count(Interview.id))) or 0
    finished = db.scalar(select(func.count(Interview.id)).where(Interview.status == "finished")) or 0
    turns = db.scalar(select(func.count(Turn.id))) or 0
    avg = db.scalar(select(func.avg(Report.total)))
    return {
        "ok": True,
        "ts": _utcnow().isoformat() + "Z",
        "interviews": interviews,
        "finished": finished,
        "turns": turns,
        "avg_score": round(float(avg or 0), 1),
        "llm_ready": llm_ready(),
    }


@app.get("/api/live/stats")
def live_stats(db: Session = Depends(get_db)):
    """WebSocket 不可用时的降级通道（前端轮询）。"""
    return _live_stats(db)


# 同时在线的看板连接上限：超限时直接拒绝并给出明确关闭码，
# 避免异常客户端反复重连把数据库查询打满。
MAX_WS_CONNECTIONS = 50
_ws_connections = 0


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    """实时数据流：每 3 秒推送一次聚合指标；客户端断开即结束。

    前端 startLive() 优先连这里，连不上（如 Pages 纯静态环境无后端 WS）
    自动降级为 /api/live/stats 轮询，功能不缺失。
    """
    global _ws_connections
    if _ws_connections >= MAX_WS_CONNECTIONS:
        await ws.close(code=1008, reason="too many connections")
        return
    await ws.accept()
    _ws_connections += 1
    try:
        while True:
            db = SessionLocal()
            try:
                await ws.send_json(_live_stats(db))
            finally:
                db.close()
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        return
    except Exception:                                  # 客户端异常断开/服务端中断
        try:
            await ws.close()
        except Exception:
            pass
    finally:
        _ws_connections = max(0, _ws_connections - 1)


# ---------------- 静态演示页（与 API 同源部署） ----------------
# backend/static/ 存在时（由 scripts/build-backend-static.js 生成，随源码上传至发布沙箱），
# 将单文件演示页、技术文档、更新日志与端侧模型挂载到站点根路径：
#   /                      演示页（apiBase=same-origin，与 API 同源，免除 CORS）
#   /docs/technical-doc.html   技术文档
#   /changelog.html            更新日志
#   /models/...                端侧模型权重
# 本地开发（无 static/）时保持纯 API 形态；挂载放在所有路由之后，/api/* 优先匹配。
_STATIC_DIR = pathlib.Path(__file__).resolve().parent.parent / "static"
if _STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(_STATIC_DIR), html=True), name="static")
