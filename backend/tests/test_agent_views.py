"""v40 · 可解释性：锚点提取与双镜头（技术面 / HR 面）评价

校验三条性质：
  ① 锚点可回切：每个锚点的 start/end 能精确切出原文，且按技术名词 > 量化 > 动作 的权重取舍；
  ② 镜头差异：同一份回答在技术面与 HR 面得到不同分数（权重不同，才叫「各自的判断」）；
  ③ 分歧可量化：gap = |tech - hr|，>=8 记为显著分歧；汇总 maxGap / avgGap 与逐轮一致；
  ④ 引用有据：quote 优先取锚点原话（fromAnchor=True），无锚点时退回开头片段并标注。
"""
from __future__ import annotations

from app.scoring import agent_views, anchor_phrases, lens_score, score_session

TECH_ANS = "用 Redis 做缓存，通过一致性哈希把 2000 QPS 压到 12ms，权衡了成本与一致性，缓存击穿用互斥锁兜底。"
HR_ANS = "当时团队里三个人意见不一致，我主动沟通对齐目标，推动大家复盘，最后按时上线，我从中学会了协调资源。"
PLAIN = "嗯，好的。"


def _turns():
    return [
        {"agent": "技术面试官", "question": "缓存怎么做的？", "answer": TECH_ANS, "notes": ""},
        {"agent": "HR 面试官", "question": "团队分歧怎么处理？", "answer": HR_ANS, "notes": ""},
    ]


def test_anchor_positions_slice_back():
    anchors = anchor_phrases(TECH_ANS)
    assert anchors, "技术型回答应提取到锚点"
    for a in anchors:
        assert TECH_ANS[a["start"]:a["end"]] == a["text"], "start/end 必须能回切原文"
    kinds = {a["kind"] for a in anchors}
    assert "skill" in kinds, "应识别出技术名词锚点（Redis）"
    assert "metric" in kinds, "应识别出量化锚点（2000 QPS / 12ms）"
    assert len(anchors) <= 3, "最多 3 个锚点，避免信息过载"


def test_no_anchor_for_plain_sentence():
    assert anchor_phrases(PLAIN) == [], "无技术/量化信息的短句不硬造锚点"


def test_two_lenses_disagree_in_direction():
    tech_res = lens_score(TECH_ANS, "tech")
    hr_res = lens_score(TECH_ANS, "hr")
    assert tech_res["score"] > hr_res["score"], "技术型回答：技术面高于 HR 面"
    assert tech_res["score"] - hr_res["score"] >= 8, "该样本应构成显著分歧"
    assert tech_res["signals"] and "技术名词" in tech_res["signals"][0]

    tech2 = lens_score(HR_ANS, "tech")
    hr2 = lens_score(HR_ANS, "hr")
    assert hr2["score"] > tech2["score"], "协作型回答：HR 面高于技术面（镜头权重不同 → 方向反转）"


def test_lens_scores_clamped():
    for lens in ("tech", "hr"):
        for answer in ("", "啊", TECH_ANS * 20):
            s = lens_score(answer, lens)["score"]
            assert 30 <= s <= 96, "所有镜头分必须落在 [30, 96] 裁剪区间"


def test_agent_views_summary_consistent():
    views = agent_views(_turns())
    assert len(views["items"]) == 2
    gaps = [it["gap"] for it in views["items"]]
    assert views["maxGap"] == max(gaps)
    assert abs(views["avgGap"] - round(sum(gaps) / len(gaps), 1)) <= 0.05
    assert views["diverged"] == sum(1 for it in views["items"] if it["diverged"])
    for it in views["items"]:
        assert it["diverged"] == (it["gap"] >= 8)
        assert abs(it["tech"]["score"] - it["hr"]["score"]) == it["gap"]
        assert it["tech"]["reason"] and it["hr"]["reason"], "两栏都必须给出可读理由"


def test_agent_views_quote_prefers_anchor():
    views = agent_views(_turns())
    first = views["items"][0]
    assert first["quote"]["fromAnchor"] is True
    assert first["quote"]["text"] in TECH_ANS
    # 无锚点时退回开头片段并明确标注（不假装有锚点）
    plain = agent_views([{"agent": "HR 面试官", "question": "q", "answer": PLAIN}])["items"][0]
    assert plain["quote"]["fromAnchor"] is False


def test_report_payload_contains_agent_views():
    result = score_session(_turns())
    assert "agent_views" in result, "报告载荷必须携带 agent_views（服务端与前端同源）"
    assert len(result["agent_views"]["items"]) == len(_turns())
