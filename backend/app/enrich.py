from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

from .llm import LLM_BASE_URL, LLM_MODEL, LLM_API_KEY, llm_ready

# 富集调用的最长等待：评分接口是同步端点，过长会拖住工作线程；
# 25s 足够 GLM-4-Flash 返回，且失败时直接回退规则评语，绝不影响主链路。
ENRICH_TIMEOUT = float(os.getenv("ENRICH_TIMEOUT", "25"))

_SYSTEM = (
    "你是资深的面试评估专家。下面会给一名候选人在模拟面试中各维度的"
    "「确定性评分（0-100，不要修改）」与「现有规则评语」，以及其部分回答原文。"
    "请为每个维度写一句更专业、具体、可执行的改进评语（中文，不超过 42 字），"
    "并为整体写一句总评（中文，不超过 60 字）。"
    "要求：只基于给定原文，不编造数据，不修改分数。"
    "仅输出 JSON，格式：{\"comments\":[\"维度1评语\",...5项顺序与输入一致],"
    "\"narrative\":\"总体一句话建议\"}。"
)


def _extract_json(text: str) -> dict | None:
    """从模型输出里抠出第一个 JSON 对象；失败返回 None。"""
    if not text:
        return None
    try:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            return json.loads(m.group(0))
    except Exception:  # noqa: BLE001
        return None
    return None


def enrich_report(dims: list[dict[str, Any]],
                  turns: list[dict[str, Any]],
                  match_info: dict | None = None) -> dict | None:
    """用 LLM 为确定性评分补充逐维质性点评与总评。

    返回 {"comments":[str*N], "narrative":str}；任何异常/不可信结果返回 None，
    调用方据此回退到规则评语。分数始终来自确定性引擎，本函数只动文字。
    """
    if not llm_ready():
        return None

    evidence = "\n".join(
        f"[{t.get('agent', '')}] {t.get('question', '')}\n答：{(t.get('answer', '') or '')[:200]}"
        for t in turns[-6:]
    )
    dim_block = "\n".join(
        f"{i + 1}. {d['dimension']}（{d['score']}分）：{d.get('comment', '')}"
        for i, d in enumerate(dims)
    )
    user = f"维度与现有评语：\n{dim_block}\n\n候选人部分回答原文：\n{evidence}"
    if match_info:
        user += f"\n\n岗位匹配信息：{json.dumps(match_info, ensure_ascii=False)}"

    try:
        with httpx.Client(timeout=httpx.Timeout(ENRICH_TIMEOUT, connect=10.0)) as client:
            resp = client.post(
                f"{LLM_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {LLM_API_KEY}",
                         "Content-Type": "application/json"},
                json={
                    "model": LLM_MODEL,
                    "temperature": 0.4,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": _SYSTEM},
                        {"role": "user", "content": user},
                    ],
                },
            )
            if resp.status_code != 200:
                return None
            payload = resp.json()
            content = payload["choices"][0]["message"]["content"]
    except Exception:  # noqa: BLE001
        return None

    parsed = _extract_json(content)
    if not parsed or not isinstance(parsed.get("comments"), list):
        return None

    comments = [str(x) for x in parsed["comments"]]
    # 数量必须对齐、长度必须合理，否则视为不可信，回退规则评语。
    if len(comments) != len(dims):
        return None
    clean = [c for c in comments if 0 < len(c) <= 80]
    if len(clean) != len(dims):
        return None

    narrative = str(parsed.get("narrative", ""))[:120]
    if not (0 < len(narrative) <= 120):
        narrative = ""

    return {"comments": clean, "narrative": narrative}
