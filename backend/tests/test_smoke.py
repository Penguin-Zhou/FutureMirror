from fastapi.testclient import TestClient

from app.main import app
from app.scoring import score_session


def test_health():
    with TestClient(app) as c:
        assert c.get("/api/health").json()["ok"] is True


def test_register_login_and_report_flow():
    with TestClient(app) as c:
        email = f"t{__import__('time').time_ns()}@ex.com"
        r = c.post("/api/auth/register",
                   json={"name": "测试", "email": email, "password": "abc123"})
        assert r.status_code == 200, r.text
        token = r.json()["token"]
        h = {"Authorization": f"Bearer {token}"}

        iv = c.post("/api/interviews", json={"mode": "tech", "job": "后端"},
                    headers=h).json()["id"]
        c.post(f"/api/interviews/{iv}/sync", headers=h, json={"turns": [
            {"seq": 1, "agent": "技术面试官", "question": "缓存一致性？",
             "answer": "用延迟双删，QPS 从 200 提升到 1200", "notes": "有量化"},
        ]})
        # 幂等：相同入参重复生成报告应覆盖而非报错，且结果一致
        body = {"match_score": 78, "code_score": 0.8, "match_gaps": ["Kubernetes"]}
        rep = c.post(f"/api/interviews/{iv}/report", headers=h, json=body).json()
        assert 0 <= rep["total"] <= 100 and len(rep["dims"]) == 5
        assert len(rep["plan"]) >= 5 and rep["weakest"]["dimension"]

        rep2 = c.post(f"/api/interviews/{iv}/report", headers=h, json=body).json()
        assert rep2["total"] == rep["total"]

        lst = c.get("/api/interviews", headers=h).json()
        assert len(lst) == 1 and lst[0]["total"] == rep["total"]


def test_demo_email_gets_vip():
    """演示账号由 lifespan 自动种子（is_vip=True），登录即可验证。"""
    with TestClient(app) as c:
        r = c.post("/api/auth/login",
                   json={"email": "demo@futuremirror.app", "password": "Demo123456"})
        assert r.status_code == 200, r.text
        assert r.json()["user"]["is_vip"] is True


def test_sync_is_idempotent_by_seq():
    """重复同步同一批 seq 不产生脏数据（v22.1：先删后插 → seq 幂等）。"""
    with TestClient(app) as c:
        email = f"t{__import__('time').time_ns()}@ex.com"
        token = c.post("/api/auth/register",
                       json={"name": "测试", "email": email, "password": "abc123"}).json()["token"]
        h = {"Authorization": f"Bearer {token}"}
        iv = c.post("/api/interviews", json={}, headers=h).json()["id"]
        turns = [{"seq": 1, "agent": "技术面试官", "question": "缓存一致性？",
                  "answer": "延迟双删，QPS 200→1200", "notes": "有量化"}]
        r1 = c.post(f"/api/interviews/{iv}/sync", headers=h, json={"turns": turns}).json()
        assert r1 == {"ok": True, "added": 1, "total": 1}
        r2 = c.post(f"/api/interviews/{iv}/sync", headers=h, json={"turns": turns}).json()
        assert r2 == {"ok": True, "added": 0, "total": 1}   # 幂等：不重复入库
        rep = c.post(f"/api/interviews/{iv}/report", headers=h, json={}).json()
        assert len(rep["evidence"]) == 1                   # 库里仍只有 1 条问答
        # 超过 30 轮拒绝
        big = {"turns": [{"seq": i, "agent": "a", "question": "q", "answer": "a"}
                         for i in range(1, 32)]}
        assert c.post(f"/api/interviews/{iv}/sync", headers=h, json=big).status_code == 400


def test_report_body_scores_with_match_and_gaps():
    """report 的 body（match_score/code_score/match_gaps）真实参与服务端评分。"""
    with TestClient(app) as c:
        email = f"t{__import__('time').time_ns()}@ex.com"
        token = c.post("/api/auth/register",
                       json={"name": "测试", "email": email, "password": "abc123"}).json()["token"]
        h = {"Authorization": f"Bearer {token}"}
        iv = c.post("/api/interviews", json={}, headers=h).json()["id"]
        c.post(f"/api/interviews/{iv}/sync", headers=h, json={"turns": [
            {"seq": 1, "agent": "技术面试官", "question": "缓存一致性？",
             "answer": "用延迟双删，QPS 从 200 提升到 1200，最终上线平稳", "notes": "有量化"},
        ]})
        body = {"match_score": 90, "code_score": 0.9, "match_gaps": ["Kubernetes", "Go"]}
        rep = c.post(f"/api/interviews/{iv}/report", headers=h, json=body).json()
        fit = next(d for d in rep["dims"] if d["key"] == "fit")
        assert "匹配分 90" in fit["comment"] and "Kubernetes" in fit["comment"]
        depth = next(d for d in rep["dims"] if d["key"] == "depth")
        assert depth["score"] > 60   # code_score 0.9 拉高了内容深度


def test_scoring_never_crashes_on_empty():
    r = score_session([])
    assert r["total"] >= 30 and len(r["plan"]) >= 5


def test_live_stats_rest_and_websocket():
    """实时看板双通道：REST 聚合指标 + WebSocket 推送。"""
    with TestClient(app) as c:
        s = c.get("/api/live/stats").json()
        assert s["ok"] is True and "interviews" in s and "turns" in s
        assert isinstance(s["avg_score"], float)

        with c.websocket_connect("/ws/live") as ws:
            first = ws.receive_json()
            assert first["ok"] is True and first["turns"] >= 0
