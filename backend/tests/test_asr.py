"""v46 · 服务端转写（asr.py）的错误分型与接口契约。

这一层的意义：浏览器自带的识别走厂商云端，境内连不上；
改成服务端转写之后，坏掉的方式变多了（没有密钥 / 上游超时 / 空音频 / 静音），
每种都要能被前端分辨出来，而不是一律「识别失败」。
"""
import asyncio

import pytest
from fastapi.testclient import TestClient

from app import asr
from app.main import app


def _wav_bytes(seconds: float = 1.0) -> bytes:
    import io
    import math
    import struct
    import wave

    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        n = int(16000 * seconds)
        w.writeframes(b"".join(struct.pack("<h", int(1200 * math.sin(2 * math.pi * 300 * i / 16000)))
                               for i in range(n)))
    return buf.getvalue()


def test_asr_ready_follows_api_key(monkeypatch):
    monkeypatch.setattr(asr, "LLM_API_KEY", "k")
    monkeypatch.delenv("ASR_DISABLED", raising=False)
    assert asr.asr_ready() is True
    monkeypatch.setattr(asr, "LLM_API_KEY", "")
    assert asr.asr_ready() is False


def test_asr_can_be_disabled_by_env(monkeypatch):
    monkeypatch.setattr(asr, "LLM_API_KEY", "k")
    monkeypatch.setenv("ASR_DISABLED", "1")
    assert asr.asr_ready() is False


def test_empty_audio_is_rejected_before_calling_upstream(monkeypatch):
    monkeypatch.setattr(asr, "LLM_API_KEY", "k")
    text, err = asyncio.run(asr.transcribe_audio(b""))
    assert (text, err) == ("", "empty_audio")


def test_not_configured(monkeypatch):
    monkeypatch.setattr(asr, "LLM_API_KEY", "")
    text, err = asyncio.run(asr.transcribe_audio(_wav_bytes()))
    assert (text, err) == ("", "not_configured")


def test_health_reports_asr_capability():
    with TestClient(app) as c:
        body = c.get("/api/health").json()
        assert "asr_ready" in body
        assert body["ok"] is True


def test_asr_requires_login():
    with TestClient(app) as c:
        r = c.post("/api/asr", content=_wav_bytes(),
                   headers={"Content-Type": "audio/wav"})
        assert r.status_code == 401


def test_asr_accepts_raw_bytes_and_returns_text(monkeypatch):
    """不做 multipart：直接收原始字节，部署端不必多装 python-multipart。"""
    async def fake_transcribe(data, filename="chunk.wav", mime="audio/wav"):
        assert data.startswith(b"RIFF")
        assert mime.startswith("audio/")
        return "我在校园二手平台里负责后端接口", ""

    monkeypatch.setattr("app.main.transcribe_audio", fake_transcribe)
    monkeypatch.setattr("app.main.asr_ready", lambda: True)
    with TestClient(app) as c:
        email = f"asr{__import__('time').time_ns()}@ex.com"
        token = c.post("/api/auth/register",
                       json={"name": "asr", "email": email, "password": "abc123"}).json()["token"]
        r = c.post("/api/asr", content=_wav_bytes(),
                   headers={"X-Auth-Token": token, "Content-Type": "audio/wav"})
        assert r.status_code == 200, r.text
        assert r.json()["text"].startswith("我在校园")


def test_silence_returns_empty_text_not_error(monkeypatch):
    """静音不是故障：上游返回空文本时也应当是 200 + 空串，前端据此不报红。"""
    async def fake_transcribe(data, filename="chunk.wav", mime="audio/wav"):
        return "", "no_speech"

    monkeypatch.setattr("app.main.transcribe_audio", fake_transcribe)
    monkeypatch.setattr("app.main.asr_ready", lambda: True)
    with TestClient(app) as c:
        email = f"asrs{__import__('time').time_ns()}@ex.com"
        token = c.post("/api/auth/register",
                       json={"name": "asr", "email": email, "password": "abc123"}).json()["token"]
        r = c.post("/api/asr", content=_wav_bytes(),
                   headers={"X-Auth-Token": token, "Content-Type": "audio/wav"})
        assert r.status_code == 200
        assert r.json()["text"] == ""


@pytest.mark.parametrize("upstream_status,expect", [
    (401, 502), (403, 502), (429, 502), (500, 502),
])
def test_upstream_failures_surface_as_502(monkeypatch, upstream_status, expect):
    async def fake_transcribe(data, filename="chunk.wav", mime="audio/wav"):
        return "", f"upstream_{upstream_status}"

    monkeypatch.setattr("app.main.transcribe_audio", fake_transcribe)
    monkeypatch.setattr("app.main.asr_ready", lambda: True)
    with TestClient(app) as c:
        email = f"asrf{__import__('time').time_ns()}@ex.com"
        token = c.post("/api/auth/register",
                       json={"name": "asr", "email": email, "password": "abc123"}).json()["token"]
        r = c.post("/api/asr", content=_wav_bytes(),
                   headers={"X-Auth-Token": token, "Content-Type": "audio/wav"})
        assert r.status_code == expect
        assert "upstream_" in r.json()["detail"]


def test_asr_disabled_returns_503(monkeypatch):
    monkeypatch.setattr("app.main.asr_ready", lambda: False)
    with TestClient(app) as c:
        email = f"asr503{__import__('time').time_ns()}@ex.com"
        token = c.post("/api/auth/register",
                       json={"name": "asr", "email": email, "password": "abc123"}).json()["token"]
        r = c.post("/api/asr", content=_wav_bytes(),
                   headers={"X-Auth-Token": token, "Content-Type": "audio/wav"})
        assert r.status_code == 503
