from __future__ import annotations

import json
import os
from typing import AsyncIterator

import httpx
from fastapi.responses import StreamingResponse

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4").rstrip("/")
LLM_MODEL = os.getenv("LLM_MODEL", "glm-4-flash")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")


def llm_ready() -> bool:
    return bool(LLM_API_KEY)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def _proxy_stream(messages: list[dict], temperature: float,
                        model: str | None) -> AsyncIterator[str]:
    """把上游 OpenAI 兼容 SSE 原样转发；上游异常时下发 error 事件，由前端降级 Mock。"""
    payload = {
        "model": model or LLM_MODEL,
        "messages": messages,
        "stream": True,
        "temperature": temperature,
    }
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    url = f"{LLM_BASE_URL}/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                if resp.status_code != 200:
                    body = (await resp.aread()).decode("utf-8", "ignore")[:300]
                    yield _sse({"error": f"upstream_{resp.status_code}", "detail": body})
                    return
                async for line in resp.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    yield f"data: {data}\n\n"      # 原样透传，前端解析逻辑无需改动
    except httpx.TimeoutException:
        yield _sse({"error": "upstream_timeout"})
    except Exception as exc:                        # noqa: BLE001
        yield _sse({"error": "proxy_failed", "detail": str(exc)[:200]})


def sse_response(messages: list[dict], temperature: float = 0.6,
                 model: str | None = None) -> StreamingResponse:
    return StreamingResponse(
        _proxy_stream(messages, temperature, model),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",   # 关掉 Nginx 缓冲，否则流式会被攒批
        },
    )
