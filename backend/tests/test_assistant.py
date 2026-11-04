"""v67 · AI 小助手的后端通道。

重点不是「能不能返回一段文字」，而是四件容易悄悄坏掉的事：
  ① 检索确实命中（不是每次都返回同一条）；
  ② 未登录可用、且额度比登录用户小；
  ③ 超限是 429 而不是静默降级成「模型没话说」；
  ④ 后端那份知识库与前端 kb.js 完全一致（否则两处答案会分叉）。
"""
import json
import pathlib
import re

import pytest
from fastapi.testclient import TestClient

from app import assistant as A, kbsearch
from app.main import app

ROOT = pathlib.Path(__file__).resolve().parents[2]
KB_JS = ROOT / "frontend" / "js" / "data" / "kb.js"


@pytest.fixture()
def client():
    A.anon_limiter.reset()
    A.user_limiter.reset()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def fake_upstream(monkeypatch):
    """把转发上游换成本地假流：既不打外部网络，也不花额度。

    这一步只替换「转发」，端点自己的检索、限流、meta 装配仍然真跑。
    """
    captured = {}

    async def fake(messages, temperature, model, meta=None):
        captured["messages"] = messages
        captured["meta"] = meta
        yield "data: " + json.dumps({"meta": meta}, ensure_ascii=False) + "\n\n"
        yield 'data: {"choices":[{"delta":{"content":"这是测试回答"}}]}\n\n'

    monkeypatch.setattr("app.llm._proxy_stream", fake)
    monkeypatch.setattr("app.main.llm_ready", lambda: True)
    return captured


def _tokens(text):
    return kbsearch.tokenize(text)


# ---------------- 检索 ----------------
def test_kb_index_loaded():
    assert kbsearch.stats()["count"] >= 30


@pytest.mark.parametrize("query,expect", [
    ("Redis 缓存穿透怎么解决", "Redis 缓存穿透"),
    ("MySQL 索引为什么选 B+ 树", "MySQL 索引"),
    ("STAR 法则怎么讲项目", "STAR"),
    ("产品经理面试考什么", "产品"),
])
def test_search_top1_is_relevant(query, expect):
    hits = kbsearch.search(query, 3)
    assert hits, f"{query} 没有命中任何条目"
    assert expect in hits[0]["title"], f"{query} 的 top1 是「{hits[0]['title']}」"


def test_search_is_not_constant():
    """两次不同查询必须给出不同首条——否则就是「检索」退化成「取第一条」。"""
    a = kbsearch.search("TCP 三次握手", 1)[0]["title"]
    b = kbsearch.search("产品经理群面", 1)[0]["title"]
    assert a != b


def test_search_empty_and_punctuation_only():
    assert kbsearch.search("", 3) == []
    assert kbsearch.search("   ", 3) == []
    assert kbsearch.search("，。！", 3) == []


def test_search_returns_score_breakdown():
    hit = kbsearch.search("Kubernetes 部署", 1)[0]
    assert 0 <= hit["score"] <= 1.5
    assert set(hit["signals"]) == {"bm25", "title", "tag", "phrase"}


def test_tokenize_matches_frontend_shape():
    """中文按 bigram 切、单字碎片被丢弃——与 kb.js 的 tokenList 同口径。"""
    toks = _tokens("Redis 缓存")
    assert "redis" in toks and "缓存" in toks
    assert "缓" not in toks           # 单字不定为 token
    assert len(toks) == len(set(toks))  # 去重


# ---------------- 知识库一致性 ----------------
def test_kb_data_matches_frontend_source():
    src = KB_JS.read_text(encoding="utf-8")
    js_titles = re.findall(r'\{\s*title:\s*"([^"]+)"', src)
    data = json.loads((ROOT / "backend" / "app" / "kb_data.json").read_text(encoding="utf-8"))
    py_titles = [e["title"] for e in data["entries"]]
    assert len(js_titles) == len(py_titles), "kb_data.json 与 kb.js 条数不一致"
    assert js_titles == py_titles, "条目顺序或标题不一致，请重跑 scripts/export-kb.js"


# ---------------- 端点：配置与校验 ----------------
def test_503_when_model_not_configured(client, monkeypatch):
    monkeypatch.setattr("app.main.llm_ready", lambda: False)
    r = client.post("/api/assistant/chat", json={"question": "面试怎么准备"})
    assert r.status_code == 503


def test_rejects_blank_question(client, fake_upstream):
    assert client.post("/api/assistant/chat", json={"question": "   "}).status_code == 400


def test_rejects_too_long_question(client, fake_upstream):
    # 超过 500 字由 pydantic 挡在前面（422），不必进到端点里
    assert client.post("/api/assistant/chat", json={"question": "问" * 501}).status_code == 422


def test_rejects_too_much_history(client, fake_upstream):
    hist = [{"role": "user", "content": "x"}] * 21
    r = client.post("/api/assistant/chat", json={"question": "你好", "history": hist})
    assert r.status_code == 400


# ---------------- 端点：匿名可用 ----------------
def test_anonymous_can_chat_and_gets_meta(client, fake_upstream):
    r = client.post("/api/assistant/chat", json={"question": "Redis 缓存穿透怎么解决"})
    assert r.status_code == 200
    body = r.text
    assert "这是测试回答" in body
    meta = fake_upstream["meta"]
    assert meta["mode"] == "backend"
    assert meta["logged_in"] is False
    assert meta["citations"], "匿名回答也必须带引用来源"
    assert "Redis 缓存穿透" in meta["citations"][0]["title"]


def test_invalid_token_still_works_as_anonymous(client, fake_upstream):
    """令牌过期不该把访客挡在门外，只应降级成匿名额度。"""
    r = client.post("/api/assistant/chat", json={"question": "STAR 怎么讲"},
                    headers={"X-Auth-Token": "not-a-real-token"})
    assert r.status_code == 200
    assert fake_upstream["meta"]["logged_in"] is False


def test_logged_in_user_is_marked(client, fake_upstream):
    email = f"a{__import__('time').time_ns()}@ex.com"
    tok = client.post("/api/auth/register",
                      json={"name": "小助手", "email": email, "password": "abc123"}).json()["token"]
    r = client.post("/api/assistant/chat", json={"question": "报告怎么看"},
                    headers={"X-Auth-Token": tok})
    assert r.status_code == 200
    assert fake_upstream["meta"]["logged_in"] is True


# ---------------- 限流 ----------------
def test_anonymous_quota_then_429(client, fake_upstream):
    for i in range(A.QUOTA_ANON["per_min"]):
        assert client.post("/api/assistant/chat", json={"question": f"问题{i}"}).status_code == 200
    r = client.post("/api/assistant/chat", json={"question": "再一次"})
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) >= 1
    assert "额度已用完" in r.json()["detail"]


def test_user_quota_is_larger_than_anonymous():
    assert A.QUOTA_USER["per_min"] > A.QUOTA_ANON["per_min"]
    assert A.QUOTA_USER["per_day"] > A.QUOTA_ANON["per_day"]


def test_limiter_window_expires():
    lim = A.RateLimiter(per_min=2, per_day=5)
    ok1, _ = lim.check("k", now=1000.0)
    ok2, _ = lim.check("k", now=1001.0)
    ok3, info = lim.check("k", now=1002.0)
    assert (ok1, ok2) == (True, True)
    assert ok3 is False and info["scope"] == "minute"
    # 窗口滑过之后重新放行
    ok4, _ = lim.check("k", now=1061.0)
    assert ok4 is True


def test_limiter_day_cap():
    lim = A.RateLimiter(per_min=100, per_day=3)
    states = [lim.check("k", now=1000.0 + i * 61)[0] for i in range(4)]
    assert states == [True, True, True, False]


def test_client_key_prefers_forwarded_for():
    class Req:
        headers = {"x-forwarded-for": "203.0.113.9, 10.0.0.1"}

        class client:
            host = "10.0.0.1"

    assert A.client_key(Req()) == "ip:203.0.113.9"


# ---------------- 提示词装配 ----------------
def test_build_messages_puts_refs_and_question():
    hits = kbsearch.search("Redis 穿透", 2)
    msgs = A.build_messages("怎么解决", hits, [])
    assert msgs[0]["role"] == "system"
    assert "面镜" in msgs[0]["content"]
    last = msgs[-1]["content"]
    assert "[1]" in last and "【参考资料】" in last
    assert "怎么解决" in last


def test_build_messages_trims_history():
    hist = [{"role": "user", "content": "x" * 3000} for _ in range(10)]
    msgs = A.build_messages("问题", [], hist)
    # system + 最多 6 条历史 + 本轮
    assert len(msgs) <= 8
    assert all(len(m["content"]) <= 1500 for m in msgs[1:-1])


def test_build_messages_flags_empty_retrieval():
    msgs = A.build_messages("完全无关的问题", [], [])
    assert "没有命中" in msgs[-1]["content"]


def test_citations_only_carry_title_and_source():
    cites = A.citations_of([{"title": "T", "source": "S", "content": "很长的正文"}])
    assert cites == [{"title": "T", "source": "S"}]
