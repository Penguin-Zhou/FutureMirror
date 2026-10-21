"""评分引擎校准测试（不变量固化）

用 calibration-cases.json 的标准样本验证评分引擎的校准性质：
  ① 单调性：答题质量提升 → 总分与对应维度分提升（区分度）
  ② 边界：所有维度分落在 [30, 96] 裁剪区间内
  ③ 确定性：同一输入重复评分结果完全一致（幂等）
  ④ 匹配融合：match_score / code_score 按设计公式进入拟合维度与内容深度
  ⑤ 舍入一致性：.5 边界采用半价向上（与前端 Math.round 逐位一致，
     修复银行家舍入导致的双引擎 1 分差异——见 calibrate 对拍记录）
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.scoring import score_session

CASES = json.loads(
    (Path(__file__).resolve().parent.parent / "scripts" / "calibration-cases.json").read_text(
        encoding="utf-8"
    )
)["cases"]
BY_ID = {c["id"]: c for c in CASES}


def run(case_id: str) -> dict:
    c = BY_ID[case_id]
    m = c.get("match") or {}
    return score_session(
        c["turns"],
        match_score=m.get("match_score"),
        code_score=m.get("code_score"),
        match_gaps=m.get("match_gaps"),
    )


def dims(result: dict) -> dict:
    return {d["key"]: d["score"] for d in result["dims"]}


def test_monotonic_total_by_answer_quality():
    """总分随答题质量单调递增：C3 短答 < C4 压力防御 < C2 缺量化 < C1 强答 < C5 强答+匹配。"""
    totals = {cid: run(cid)["total"] for cid in ("C3", "C4", "C2", "C1", "C5")}
    assert totals["C3"] < totals["C4"] < totals["C2"] < totals["C1"] < totals["C5"]


def test_dimension_separation():
    """每个维度只对目标特征敏感：量化→深度，STAR→逻辑，口头禅→表达，防御→抗压，匹配→拟合。"""
    d1, d2, d3, d4, d5 = (dims(run(c)) for c in ("C1", "C2", "C3", "C4", "C5"))
    assert d1["depth"] > d2["depth"] == d3["depth"] == d4["depth"]   # 量化数据拉开深度
    assert d1["logic"] > d3["logic"] and d2["logic"] > d3["logic"]   # STAR 结构拉开逻辑
    assert d3["expression"] < d1["expression"]                       # 口头禅压低表达
    assert d4["stress"] < d1["stress"] - 20                          # 防御性表述孤立抗压维度
    assert d5["fit"] - d1["fit"] >= 25                               # 匹配报告分显著进入拟合


def test_all_dimensions_within_clamp_range():
    for cid in ("C1", "C2", "C3", "C4", "C5"):
        for d in run(cid)["dims"]:
            assert 30 <= d["score"] <= 96


def test_deterministic_and_idempotent():
    for cid in ("C1", "C5"):
        assert run(cid) == run(cid)


def test_plan_and_weakest_derived_from_dims():
    for cid in ("C1", "C3", "C4"):
        r = run(cid)
        assert len(r["plan"]) == 7                       # 3+2+1 动态分配 + 2 天基础项
        weakest = min(dims(r).values())
        assert r["weakest"]["score"] == weakest
        assert r["plan"][0]["tag"] == r["weakest"]["dimension"]   # 最弱维度排在最前


def test_half_up_rounding_matches_frontend():
    """C1 内容深度真值为 90.5：必须半价向上到 91（JS Math.round 语义），
    而非银行家舍入的 90——双引擎对拍（5/5 一致）依赖此规则。"""
    assert dims(run("C1"))["depth"] == 91
    assert dims(run("C5"))["depth"] == 90


@pytest.mark.parametrize("cid", ["C1", "C2", "C3", "C4", "C5"])
def test_evidence_cites_last_turns(cid):
    r = run(cid)
    turns = BY_ID[cid]["turns"]
    assert len(r["evidence"]) == min(4, len(turns))
    assert all(e["agent"] for e in r["evidence"])
