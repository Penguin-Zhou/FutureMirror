"""v33 摄像头面试状态检测：后端聚合接口的回归测试。

覆盖：
- 鉴权：无令牌 / 错误令牌 → 401
- 创建会话 → 上报状态采样 → 后端聚合在场率 / 专注率 / 最新状态
- GET 拉取历史聚合
- 跨用户隔离：A 不能读写 B 的会话状态（404）
- 不存在的会话 → 404
- 后端只存结构化结果（face_present/attentive/label），从不接收原始视频帧
"""
from fastapi.testclient import TestClient

from app.main import app


def _register(c, email):
    r = c.post("/api/auth/register",
               json={"name": "测试", "email": email, "password": "abc123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def test_status_requires_auth():
    """未携带令牌上报 / 拉取状态 → 401。"""
    with TestClient(app) as c:
        iv = "iv_does_not_matter"
        assert c.post(f"/api/interviews/{iv}/status",
                       json={"face_present": True}).status_code == 401
        assert c.get(f"/api/interviews/{iv}/status").status_code == 401


def test_status_flow_and_aggregation():
    """上报若干采样后，后端聚合出正确的在场率 / 专注率 / 最新状态。"""
    with TestClient(app) as c:
        token = _register(c, f"t{__import__('time').time_ns()}@ex.com")
        h = {"X-Auth-Token": token}

        iv = c.post("/api/interviews", json={"mode": "tech"}, headers=h).json()["id"]

        # 模拟前端按节拍上报：3 次在场专注 + 1 次暂离
        samples = [
            {"face_present": True, "attentive": True, "label": "专注面试中", "turn": 1},
            {"face_present": True, "attentive": True, "label": "专注面试中", "turn": 2},
            {"face_present": True, "attentive": False, "label": "在场但注意力分散", "turn": 3},
            {"face_present": False, "attentive": None, "label": "暂离（未检测到人脸）", "turn": 3},
        ]
        last = None
        for s in samples:
            r = c.post(f"/api/interviews/{iv}/status", headers=h, json=s)
            assert r.status_code == 200, r.text
            last = r.json()

        # 在场率 = 3/4 = 75.0；专注率 = 2/3 ≈ 66.7
        assert last["count"] == 4
        assert last["presence_rate"] == 75.0
        assert abs(last["attentive_rate"] - 66.7) < 0.2
        assert last["latest"] == "暂离（未检测到人脸）"

        # GET 拉取同一聚合
        g = c.get(f"/api/interviews/{iv}/status", headers=h).json()
        assert g["count"] == 4
        assert g["presence_rate"] == 75.0
        assert len(g["events"]) == 4
        # 最近 20 条事件按时间正序，首条为最早样本
        assert g["events"][0]["label"] == "专注面试中"


def test_status_heartbeat_only_has_null_presence_excluded_from_rate():
    """仅心跳（face_present=null）不污染在场率分母。"""
    with TestClient(app) as c:
        token = _register(c, f"t{__import__('time').time_ns()}@ex.com")
        h = {"X-Auth-Token": token}
        iv = c.post("/api/interviews", json={}, headers=h).json()["id"]

        c.post(f"/api/interviews/{iv}/status", headers=h,
               json={"face_present": None, "attentive": None,
                     "label": "摄像头已开启 · 初始化", "detector": "heartbeat"})
        c.post(f"/api/interviews/{iv}/status", headers=h,
               json={"face_present": True, "attentive": True, "label": "专注面试中"})

        g = c.get(f"/api/interviews/{iv}/status", headers=h).json()
        # 1 条有效在场采样，在场率应为 100，心跳不计入分母
        assert g["presence_rate"] == 100.0
        assert g["count"] == 2
        assert g["latest"] == "专注面试中"


def test_status_isolated_across_users():
    """A 创建的会话，B 既看不到也不能写。"""
    with TestClient(app) as c:
        a = _register(c, f"a{__import__('time').time_ns()}@ex.com")
        b = _register(c, f"b{__import__('time').time_ns()}@ex.com")
        ha, hb = {"X-Auth-Token": a}, {"X-Auth-Token": b}

        iv = c.post("/api/interviews", json={}, headers=ha).json()["id"]
        c.post(f"/api/interviews/{iv}/status", headers=ha,
               json={"face_present": True, "attentive": True, "label": "专注面试中"})

        # B 上报 → 404；B 拉取 → 404
        assert c.post(f"/api/interviews/{iv}/status", headers=hb,
                      json={"face_present": True}).status_code == 404
        assert c.get(f"/api/interviews/{iv}/status", headers=hb).status_code == 404


def test_status_unknown_interview_404():
    """不存在的会话 → 404。"""
    with TestClient(app) as c:
        token = _register(c, f"t{__import__('time').time_ns()}@ex.com")
        h = {"X-Auth-Token": token}
        assert c.post("/api/interviews/iv_no_such_id/status", headers=h,
                      json={"face_present": True}).status_code == 404
        assert c.get("/api/interviews/iv_no_such_id/status", headers=h).status_code == 404


def test_status_empty_interview_has_no_rates():
    """从未上报任何采样时，在场率 / 专注率为 null，不崩。"""
    with TestClient(app) as c:
        token = _register(c, f"t{__import__('time').time_ns()}@ex.com")
        h = {"X-Auth-Token": token}
        iv = c.post("/api/interviews", json={}, headers=h).json()["id"]
        g = c.get(f"/api/interviews/{iv}/status", headers=h).json()
        assert g["count"] == 0
        assert g["presence_rate"] is None
        assert g["attentive_rate"] is None
        assert g["latest"] is None


# ---------------- v34：评估报告携带面试状态聚合 ----------------

def _seed_turns(c, h, iv, n=2):
    """写入 n 轮问答，让报告有评分依据。"""
    body = {"turns": [{"seq": i + 1, "agent": "技术面试官",
                       "question": f"第 {i + 1} 题：讲讲你的项目",
                       "answer": "我负责订单服务，通过分库把延迟从 800ms 降到 120ms，QPS 提升 3 倍。",
                       "notes": "含量化数据"} for i in range(n)]}
    r = c.post(f"/api/interviews/{iv}/sync", headers=h, json=body)
    assert r.status_code == 200, r.text


def test_report_includes_camera_status():
    """报告返回体里带 status：在场率 / 专注率 / 采样次数与状态接口一致。"""
    with TestClient(app) as c:
        token = _register(c, f"t{__import__('time').time_ns()}@ex.com")
        h = {"X-Auth-Token": token}
        iv = c.post("/api/interviews", json={"mode": "tech"}, headers=h).json()["id"]
        _seed_turns(c, h, iv)

        for s in [{"face_present": True, "attentive": True, "label": "专注面试中", "turn": 1},
                  {"face_present": True, "attentive": True, "label": "专注面试中", "turn": 2},
                  {"face_present": False, "attentive": None, "label": "暂离（未检测到人脸）", "turn": 2}]:
            assert c.post(f"/api/interviews/{iv}/status", headers=h, json=s).status_code == 200

        r = c.post(f"/api/interviews/{iv}/report", headers=h, json={"match_score": None})
        assert r.status_code == 200, r.text
        rep = r.json()

        assert "status" in rep
        st = rep["status"]
        # 在场率 = 2/3 ≈ 66.7；专注率 = 2/2 = 100
        assert st["count"] == 3
        assert abs(st["presence_rate"] - 66.7) < 0.2
        assert st["attentive_rate"] == 100.0
        assert st["latest"] == "暂离（未检测到人脸）"
        # 与状态接口同一口径
        g = c.get(f"/api/interviews/{iv}/status", headers=h).json()
        assert g["count"] == st["count"] and g["presence_rate"] == st["presence_rate"]


def test_report_without_camera_reports_zero_samples():
    """未开启摄像头时，报告仍返回 status（count=0、比率为 null），前端据此显示中性提示。"""
    with TestClient(app) as c:
        token = _register(c, f"t{__import__('time').time_ns()}@ex.com")
        h = {"X-Auth-Token": token}
        iv = c.post("/api/interviews", json={}, headers=h).json()["id"]
        _seed_turns(c, h, iv)

        rep = c.post(f"/api/interviews/{iv}/report", headers=h, json={}).json()
        assert rep["status"]["count"] == 0
        assert rep["status"]["presence_rate"] is None
        assert rep["status"]["attentive_rate"] is None
        # 评分主链路不受影响
        assert rep["total"] > 0 and len(rep["dims"]) == 5

