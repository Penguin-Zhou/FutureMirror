"""评分引擎校准脚本（服务端引擎）

用 calibration-cases.json 中的 5 个标准样本跑服务端评分引擎，
输出可嵌入技术文档的校准表。与 scripts/calibrate-scoring.js（前端引擎）
共用同一份案例数据，用于双引擎一致性校验。

用法：
    python backend/scripts/calibrate_scoring.py           # Markdown 表
    python backend/scripts/calibrate_scoring.py --json    # JSON（供对拍）
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.scoring import score_session  # noqa: E402

CASES = json.loads(
    (Path(__file__).resolve().parent / "calibration-cases.json").read_text(encoding="utf-8")
)["cases"]


def run_case(case: dict) -> dict:
    m = case.get("match") or {}
    return score_session(
        case["turns"],
        match_score=m.get("match_score"),
        code_score=m.get("code_score"),
        match_gaps=m.get("match_gaps"),
    )


def main() -> None:
    results = []
    for c in CASES:
        r = run_case(c)
        results.append({"id": c["id"], "name": c["name"], **r})
        if "--json" in sys.argv:
            continue
        dims = " | ".join(f'{d["dimension"]} {d["score"]}' for d in r["dims"])
        print(f'{c["id"]} {c["name"]}')
        print(f"   总分 {r['total']} ｜ {dims}")
        print(f'   最弱维度：{r["weakest"]["dimension"]}（{r["weakest"]["score"]}）｜ 学习路径 {len(r["plan"])} 天')
    if "--json" in sys.argv:
        print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
