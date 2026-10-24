"""enrich_report：确定性评分之上的 LLM 质性增强（失败安全 + 解析校验）。

仅覆盖解析/校验/回退逻辑，LLM 网络调用一律 mock；真实 LLM 集成不进单测（避免抖动/计费）。
llm_ready 显式 patch 为 True，使解析路径稳定可达，不受运行环境是否配置 Key 影响。
"""
import json
from unittest.mock import MagicMock, patch

from app import enrich


def _fake_client(payload_json, status=200):
    resp = MagicMock()
    resp.status_code = status
    resp.json.return_value = {"choices": [{"message": {"content": json.dumps(payload_json)}}]}
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False
    client.post.return_value = resp
    return client


def _dims(n=5):
    return [{"dimension": f"D{i}", "score": 70 + i, "comment": f"c{i}"} for i in range(n)]


def test_enrich_valid_json_returns_comments_and_narrative():
    payload = {"comments": ["好1", "好2", "好3", "好4", "好5"], "narrative": "总体不错"}
    with patch("app.enrich.llm_ready", return_value=True), \
         patch("app.enrich.httpx.Client", return_value=_fake_client(payload)):
        out = enrich.enrich_report(_dims(), [{"agent": "a", "question": "q", "answer": "x"}])
    assert out is not None
    assert out["comments"] == ["好1", "好2", "好3", "好4", "好5"]
    assert out["narrative"] == "总体不错"


def test_enrich_skips_when_llm_not_ready():
    # llm_ready() 为 False 时直接回退 None，且不发起任何网络请求
    with patch("app.enrich.llm_ready", return_value=False):
        assert enrich.enrich_report(_dims(), [{"answer": "x"}]) is None


def test_enrich_wrong_comment_count_falls_back():
    # 数量与维度不对齐 → 视为不可信，回退规则评语
    payload = {"comments": ["只有一条"], "narrative": "x"}
    with patch("app.enrich.llm_ready", return_value=True), \
         patch("app.enrich.httpx.Client", return_value=_fake_client(payload)):
        assert enrich.enrich_report(_dims(), [{"answer": "x"}]) is None


def test_enrich_non_json_response_falls_back():
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = {"choices": [{"message": {"content": "这不是 json"}}]}
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False
    client.post.return_value = resp
    with patch("app.enrich.llm_ready", return_value=True), \
         patch("app.enrich.httpx.Client", return_value=client):
        assert enrich.enrich_report(_dims(), [{"answer": "x"}]) is None


def test_enrich_http_error_falls_back():
    resp = MagicMock()
    resp.status_code = 500
    resp.json.return_value = {}
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False
    client.post.return_value = resp
    with patch("app.enrich.llm_ready", return_value=True), \
         patch("app.enrich.httpx.Client", return_value=client):
        assert enrich.enrich_report(_dims(), [{"answer": "x"}]) is None


def test_enrich_exception_falls_back():
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False
    client.post.side_effect = RuntimeError("boom")
    with patch("app.enrich.llm_ready", return_value=True), \
         patch("app.enrich.httpx.Client", return_value=client):
        assert enrich.enrich_report(_dims(), [{"answer": "x"}]) is None
