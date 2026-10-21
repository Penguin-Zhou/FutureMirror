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
            "weakest": {"dimension": weakest["dimension"], "score": weakest["score"]}}
