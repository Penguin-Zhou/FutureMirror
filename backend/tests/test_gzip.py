"""压缩策略回归测试：静态页压缩，SSE 接口跳过。

背景：镜像网关不做 gzip，单文件演示页 765KB 原样传输，国内首屏多传 540KB。
后端补 SelectiveGZipMiddleware 后，必须同时保证「页面被压缩」与
「/api/chat/stream 不被压缩」——后者一旦被压缩，代理缓冲会让逐字流式输出
退化成整段到达，直接毁掉演示里最重要的 AI 交互证据。
"""

from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.responses import PlainTextResponse
from starlette.routing import Route

from app.main import SelectiveGZipMiddleware, app

BIG = "x" * 5000
GZIP = {"Accept-Encoding": "gzip"}


def _stub_app() -> Starlette:
    """最小 ASGI 应用：一个普通大响应 + 一个 SSE 路径。"""

    async def big(_):
        return PlainTextResponse(BIG)

    async def sse(_):
        return PlainTextResponse(BIG, media_type="text/event-stream")

    return Starlette(routes=[Route("/big", big), Route("/api/chat/stream", sse)])


def test_static_page_is_compressed():
    with TestClient(app) as c:
        r = c.get("/", headers=GZIP)
        assert r.status_code == 200
        assert r.headers.get("content-encoding") == "gzip"
        # 解压后仍是完整演示页（CSS/JS 全内联）
        assert len(r.text) > 200_000


def test_sse_endpoint_is_not_compressed():
    stub = SelectiveGZipMiddleware(_stub_app(), minimum_size=1024)
    with TestClient(stub) as c:
        assert c.get("/big", headers=GZIP).headers.get("content-encoding") == "gzip"
        assert c.get("/api/chat/stream", headers=GZIP).headers.get("content-encoding") is None
