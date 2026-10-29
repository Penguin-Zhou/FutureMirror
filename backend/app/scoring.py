from __future__ import annotations

import math
import re
from typing import Any

# 与前端 demo（public/futuremirror-demo.html）scoreSession 保持同一套规则，
# 维度定义 / 技能词典 / 评语文案逐条对应，保证「前端本地引擎」与「服务端引擎」可互相验证。

DIM_DEFS = [
    ("depth",      "内容深度", ["为最强项目补充 3 个可深挖技术点与量化结果", "复盘一个失败案例，讲清根因与改进"]),
    ("logic",      "结构逻辑", ["用 STAR 重写两个核心项目的 300 字介绍", "每天口述 1 遍项目介绍并录音回听"]),
    ("expression", "语言表达", ["录音练习，消除口头禅（然后/那个/就是）", "把长回答拆成「总-分-总」三段式"]),
    ("fit",        "岗位匹配", ["针对匹配报告中的缺口技能制定 30 天补强计划", "把缺口技能写成课程项目并更新简历"]),
    ("stress",     "抗压表现", ["完成 2 次压力面模拟，练习被打断后的恢复话术", "预演 5 个尖锐问题（方案缺陷/换人重做/deadline 提前）"]),
]
BASE_PLAN = ["全流程综合模拟一次，对比历史报告看进步曲线",
             "把本次报告的证据清单过一遍，标记已改进项"]

SKILL_DICT = ["React", "Vue", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
              "Go", "C++", "SQL", "MySQL", "Redis", "Docker", "Kubernetes", "Git",
              "Linux", "机器学习", "深度学习", "PyTorch", "TensorFlow", "LLM", "RAG",
              "Prompt", "Agent", "Next.js", "Tailwind", "Figma", "产品设计", "项目管理",
              "数据分析", "消息队列", "Kafka"]


def _clamp(v: float) -> int:
    # 半价向上（floor(v+0.5)），与前端 Math.round 语义逐位一致。
    # 校准对拍（calibrate_scoring.py ↔ calibrate-scoring.js）发现：
    # Python 内置 round() 是银行家舍入（90.5→90），JS Math.round 是半价向上
    # （90.5→91），双引擎在 .5 边界会差 1 分——评分引擎必须消除这种不确定性。
    return max(30, min(96, math.floor(v + 0.5)))


# ---------------- v40 · 锚点与双镜头评价 ----------------
# 与前端 features/explain.js 的 anchorPhrases / lensScore 逐条对齐：
# 同一份回答，技术面与 HR 面用不同权重独立打分，分歧度即「多 Agent 各自判断」的证据。

METRIC_RE = re.compile(r"[\d.]+\s*(?:%|qps|QPS|ms|毫秒|万|亿|倍|人日|人|天|小时|分钟|秒|GB|MB|TB|核|台)")
ACTION_RE = re.compile(r"(?:负责|实现|搭建|优化|设计|主导|重构|上线|接入|迁移|排查|压测)[^，。；、,.;!?！？\s]{0,8}")
COLLAB_RE = re.compile(r"(?:协作|沟通|推动|协调|带队|配合|汇报|对齐)[^，。；、,.;!?！？\s]{0,6}")


def _anchor_candidates(text: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for s in sorted(SKILL_DICT, key=len, reverse=True):
        i = text.find(s)
        while i >= 0:
            out.append({"start": i, "end": i + len(s), "kind": "skill", "weight": 3})
            i = text.find(s, i + 1)
    for m in METRIC_RE.finditer(text):
        if len(m.group(0).strip()) >= 2:
            out.append({"start": m.start(), "end": m.end(), "kind": "metric", "weight": 2})
    for re_ in (ACTION_RE, COLLAB_RE):
        for m in re_.finditer(text):
            if len(m.group(0)) >= 3:
                out.append({"start": m.start(), "end": m.end(), "kind": "action", "weight": 1})
    return out


def anchor_phrases(text: str) -> list[dict[str, Any]]:
    """提取可锚定片段（技术名词 > 量化 > 动作），最多 3 个，按出现位置排序。"""
    src = text or ""
    if not src.strip():
        return []
    cands = sorted(_anchor_candidates(src), key=lambda c: (-c["weight"], -(c["end"] - c["start"])))
    kept: list[dict[str, Any]] = []
    for c in cands:
        if any(c["start"] < k["end"] and k["start"] < c["end"] for k in kept):
            continue
        kept.append(c)
        if len(kept) >= 6:
            break
    kept = sorted(kept[:3], key=lambda c: c["start"])
    return [{"start": c["start"], "end": c["end"], "text": src[c["start"]:c["end"]],
             "kind": c["kind"], "weight": c["weight"]} for c in kept]


def _lens_features(text: str) -> dict[str, int]:
    t = text or ""
    return {
        "len": len(t),
        "digits": len(re.findall(r"\d", t)),
        "skills": sum(1 for s in SKILL_DICT if s in t),
        "principle": len(re.findall(r"原理|机制|一致性|索引|并发|缓存|锁|架构|协议|复杂度|算法|事务|幂等|超时|重试|链路", t)),
        "tradeoff": len(re.findall(r"权衡|取舍|对比|相比|替代|因为|代价|成本|降级|兜底", t)),
        "star": len(re.findall(r"背景|目标|负责|通过|最终|结果|因此|于是", t)),
        "collab": len(re.findall(r"团队|协作|沟通|推动|协调|配合|对接|复盘", t)),
        "motive": len(re.findall(r"为什么|成长|学习|规划|价值|兴趣|选择", t)),
        "filler": len(re.findall(r"然后|那个|就是", t)),
    }


def lens_score(answer: str, lens: str) -> dict[str, Any]:
    f = _lens_features(answer)
    len_bonus = min(6, f["len"] // 80)
    signals: list[str] = []
    if lens == "tech":
        score = _clamp(40 + min(18, f["skills"] * 6) + min(14, f["digits"] * 2)
                       + min(12, f["principle"] * 4) + min(8, f["tradeoff"] * 3)
                       + len_bonus - min(8, f["filler"] * 2))
        if f["skills"]:
            signals.append(f"技术名词 {f['skills']} 个")
        if f["digits"]:
            signals.append(f"量化数字 {f['digits']} 个")
        if f["principle"]:
            signals.append(f"原理性表述 {f['principle']} 处")
        if f["tradeoff"]:
            signals.append(f"取舍/对比 {f['tradeoff']} 处")
        if f["filler"]:
            signals.append(f"口头禅 {f['filler']} 处")
        reason = ("回答给出了可验证的实现细节，技术面判为「经得起深挖」" if score >= 75 else
                  "有实现轮廓，但原理与量化证据不足，技术面保留判断" if score >= 60 else
                  "只有结论没有机制与数据，技术面判为「需立即追问」")
    else:
        score = _clamp(42 + min(14, f["star"] * 4) + min(14, f["collab"] * 6)
                       + min(10, f["motive"] * 4) + min(6, f["digits"]) + len_bonus
                       - min(10, f["filler"] * 3))
        if f["star"]:
            signals.append(f"STAR 结构线索 {f['star']} 处")
        if f["collab"]:
            signals.append(f"协作表述 {f['collab']} 处")
        if f["motive"]:
            signals.append(f"动机/成长表述 {f['motive']} 处")
        if f["filler"]:
            signals.append(f"口头禅 {f['filler']} 处")
        reason = ("叙事完整、协作与动机线索清晰，HR 面判为「可继续推进」" if score >= 75 else
                  "有事实但缺协作角色与结果，HR 面认为「画像还不够立体」" if score >= 60 else
                  "缺少团队角色与动机交代，HR 面判为「稳定性存疑」")
    return {"score": score, "signals": signals, "reason": reason}


def agent_views(turns: list[dict[str, Any]]) -> dict[str, Any]:
    items = []
    for i, t in enumerate(turns):
        answer = t.get("answer", "") or ""
        anchors = t.get("anchors") or anchor_phrases(answer)
        tech = lens_score(answer, "tech")
        hr = lens_score(answer, "hr")
        gap = abs(tech["score"] - hr["score"])
        if anchors:
            quote = {"text": anchors[0]["text"], "fromAnchor": True}
        else:
            flat = re.sub(r"\s+", " ", answer).strip()
            quote = {"text": flat[:28] + "…" if len(flat) > 28 else flat, "fromAnchor": False}
        items.append({"turn": i + 1, "asker": t.get("agent", ""), "question": t.get("question", ""),
                      "quote": quote, "tech": tech, "hr": hr, "gap": gap,
                      "diverged": gap >= 8})
    gaps = [x["gap"] for x in items]
    return {
        "items": items,
        "maxGap": max(gaps) if gaps else 0,
        "avgGap": (math.floor(sum(gaps) / len(gaps) * 10 + 0.5) / 10) if gaps else 0,
        "diverged": sum(1 for x in items if x["diverged"]),
    }


def score_session(turns: list[dict[str, Any]], match_score: int | None = None,
                  code_score: float | None = None,
                  match_gaps: list[str] | None = None) -> dict[str, Any]:
    """turns: [{agent, question, answer, notes, mode}] —— 规则与前端版保持一致。"""
    all_text = "\n".join(t.get("answer", "") for t in turns)
    digit_count = len(re.findall(r"\d", all_text))
    tech_hits = sum(1 for s in SKILL_DICT if s in all_text)
    filler = len(re.findall(r"然后|那个|就是", all_text))
    star_hits = len(re.findall(r"背景|目标|负责|通过|最终|结果|因此|于是", all_text))
    defensive = len(re.findall(r"不是我的|跟我没关系|但是|我没有", all_text))
    short_answers = sum(1 for t in turns if len(t.get("answer", "")) < 40)
    pressure_turns = [t for t in turns if t.get("mode") == "pressure"]

    depth = _clamp(48 + min(22, digit_count * 2.2) + min(18, tech_hits * 2.5)
                   + (8 if len(turns) >= 4 else 0))
    if code_score is not None:
        depth = _clamp(depth * 0.8 + code_score * 100 * 0.2)
    logic = _clamp(46 + min(30, star_hits * 4) + (8 if len(turns) >= 3 else 0))
    expression = _clamp(88 - min(24, filler * 5) - short_answers * 4)
    if match_score is not None:
        fit = _clamp(52 + match_score * 0.4 + min(10, tech_hits))
    else:
        fit = _clamp(55 + min(20, tech_hits * 2))
    stress = _clamp(72 - min(20, defensive * 6)
                    - (min(12, short_answers * 3) if pressure_turns else 6))

    comments = [
        "回答包含量化数据，细节可信度较好" if digit_count >= 4 else "缺少量化数据支撑，建议补充延迟/QPS/用户数",
        "具备 STAR 结构意识，收尾可更明确" if star_hits >= 3 else "结构松散，建议用 STAR（背景-目标-行动-结果）组织",
        "口头禅偏多，影响专业度" if filler > 2 else "表达流畅度良好",
        (f"基于匹配报告：匹配分 {match_score}，缺口 "
         f"{('、'.join((match_gaps or [])[:3])) or '无'}") if match_score is not None
        else "未生成匹配报告，按技能命中估算",
        "出现防御性表述，压力下需先承认再解释" if defensive > 1 else "面对追问保持冷静，偶有防御性表述",
    ]
    dims = []
    for (key, name, pool), score, comment in zip(DIM_DEFS,
                                                 [depth, logic, expression, fit, stress],
                                                 comments):
        dims.append({"key": key, "dimension": name, "score": score,
                     "comment": comment, "pool": pool})

    total = math.floor(sum(d["score"] for d in dims) / len(dims) + 0.5)   # 半价向上，同 _clamp
    weakest = min(dims, key=lambda d: d["score"])

    plan, day = [], 1
    for alloc, d in zip([3, 2, 1], sorted(dims, key=lambda d: d["score"])[:3]):
        for task in d["pool"][:alloc]:
            plan.append({"day": f"Day {day}", "task": task, "tag": d["dimension"]})
            day += 1
    for task in BASE_PLAN:
        plan.append({"day": f"Day {day}", "task": task, "tag": "综合"})
        day += 1

    evidence = [
        {"agent": t.get("agent", ""),
         "quote": (t.get("answer", "")[:60] + "…") if len(t.get("answer", "")) > 60 else t.get("answer", ""),
         "note": t.get("notes", "")}
        for t in turns[-4:]
    ]
    return {"total": total, "dims": dims, "plan": plan, "evidence": evidence,
            "weakest": {"dimension": weakest["dimension"], "score": weakest["score"]},
            "agent_views": agent_views(turns)}
