"""语音转写（v46）

浏览器自带的 SpeechRecognition 走的是厂商云端（Chrome 走 Google、Edge 走微软），
境内网络基本连不上，线上会稳定得到 `network` 错误——对演示来说等于语音功能失效。
这里用同一条 GLM 密钥在服务端转写，境内可达，也不需要引入新的依赖。

隐私口径（与前端文案保持一致）：音频只在用户按下麦克风时上传，转写完即丢弃，
不落盘、不写日志、不进数据库。
"""
from __future__ import annotations

import os

import httpx

from .llm import LLM_API_KEY, LLM_BASE_URL

ASR_MODEL = os.getenv("ASR_MODEL", "glm-asr-2512")
# 上游单次限制是 30 秒 / 25MB；前端按 6 秒切一段，这里只做兜底防护
ASR_MAX_BYTES = 8 * 1024 * 1024


def asr_ready() -> bool:
    """未配置密钥或显式关闭时，前端会退回浏览器自带接口（或提示改用键盘）。"""
    if os.getenv("ASR_DISABLED", "").lower() in ("1", "true", "yes"):
        return False
    return bool(LLM_API_KEY)


async def transcribe_audio(data: bytes, filename: str = "chunk.wav",
                           mime: str = "audio/wav") -> tuple[str, str]:
    """返回 (文本, 错误码)。错误码为空表示成功。

    错误码只描述「坏在哪一层」，具体话术交给前端——后端不猜用户能看到什么。
    """
    if not asr_ready():
        return "", "not_configured"
    if not data:
        return "", "empty_audio"
    if len(data) > ASR_MAX_BYTES:
        return "", "too_large"

    url = f"{LLM_BASE_URL}/audio/transcriptions"
    headers = {"Authorization": f"Bearer {LLM_API_KEY}"}
    form = {"model": ASR_MODEL, "stream": "false"}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0)) as client:
            resp = await client.post(url, headers=headers, data=form,
                                     files={"file": (filename, data, mime)})
    except httpx.TimeoutException:
        return "", "upstream_timeout"
    except Exception as exc:                                   # noqa: BLE001
        return "", f"transport_error:{str(exc)[:80]}"

    if resp.status_code in (401, 403):
        return "", "upstream_auth"
    if resp.status_code == 429:
        return "", "upstream_rate"
    if resp.status_code != 200:
        return "", f"upstream_{resp.status_code}"

    try:
        payload = resp.json()
    except Exception:                                          # noqa: BLE001
        return "", "bad_json"
    text = (payload.get("text") or "").strip()
    if not text:
        # 上游对静音 / 纯噪声会返回空文本，这不是故障
        return "", "no_speech"
    return text, ""
