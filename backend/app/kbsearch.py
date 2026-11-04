"""v67 · 服务端知识库检索。

为什么要有这个文件：
    AI 小助手原来在浏览器里检索（`frontend/js/data/kb.js` 的 BM25 + 端侧向量），
    再把结果拼进 prompt 发给模型。检索留在客户端意味着：
      · 换一台机器、清一次缓存，检索质量就变（端侧向量要下载 20MB 模型）；
      · 服务端无法知道「这次回答引用了什么」，引用只能靠前端自己贴；
      · 想加一条知识必须发一次前端包。
    现在检索搬到服务端，条目由 `scripts/export-kb.js` 从前端同一份数据导出
    （`kb_data.json`），两边由 `--check` 与 pytest 双向守着。

口径与前端保持一致（不然同一句话在两处会给出不同答案）：
    · 分词：按空白与中文标点切，丢弃长度 < 2 的碎片；中文再补 bigram
    · BM25：k1=1.5 / b=0.75，标题重复一次（等价标题权重 ×2），tags 并入正文
    · 重排：标题覆盖、标签覆盖、最长公共子串、来源类型先验、长度先验
**刻意不做**的部分：前端的端侧向量（MiniLM / hashing）在这里没有对应实现。
    纯词面检索对「同义不同词」的问题会弱一些，这是已知差距，不假装补齐。
"""
from __future__ import annotations

import json
import math
import pathlib
import re
import threading
from typing import Any

_DATA_PATH = pathlib.Path(__file__).with_name("kb_data.json")

# 与 kb.js 的 tokenList 用同一组分隔符（含全角空格）
_SPLIT_RE = re.compile(r"[\s，。、；：？！,.;:?!()（）\[\]{}'\"“”…·\u3000]+")
_CJK_RE = re.compile(r"[\u4e00-\u9fff]")

# 与 kb.js 的 RERANK_CFG 对齐；改动前先看那边是不是也改了
_TOPN = 8
_W_HYBRID = 0.55
_W_FEAT = 0.45
_FEAT_W = {"title": 0.34, "tag": 0.22, "phrase": 0.24, "type": 0.12, "len": 0.08}
_TYPE_PRIOR = {"合成面经": 1.0, "合成JD": 0.95, "合成题库": 0.9, "合成指南": 0.85, "合成报告": 0.8}
_IDEAL_LEN = 170
_K1 = 1.5
_B = 0.75

_lock = threading.Lock()
_index: dict[str, Any] | None = None


def token_list(text: str) -> list[str]:
    raw = [t for t in _SPLIT_RE.split(str(text).lower()) if len(t) >= 2]
    out = list(raw)
    for t in raw:
        if _CJK_RE.search(t):
            out.extend(t[i:i + 2] for i in range(len(t) - 1))
    return out


def tokenize(text: str) -> list[str]:
    """去重但保持首次出现顺序——与前端 `[...new Set(...)]` 语义一致。"""
    return list(dict.fromkeys(token_list(text)))


def _coverage(tokens: list[str], text: str) -> float:
    if not tokens or not text:
        return 0.0
    low = str(text).lower()
    return sum(1 for t in tokens if t in low) / len(tokens)


def lcs_ratio(a: str, b: str) -> float:
    """最长公共**子串**占比（连续），与前端 lcsRatio 同义。

    用滚动数组 DP，O(n·m)。查询与条目都是短文本，开销可忽略。
    """
    if not a or not b:
        return 0.0
    A, B = str(a).lower(), str(b).lower()
    prev = [0] * (len(B) + 1)
    best = 0
    for i in range(1, len(A) + 1):
        diag = 0
        for j in range(1, len(B) + 1):
            above = prev[j]
            prev[j] = diag + 1 if A[i - 1] == B[j - 1] else 0
            if prev[j] > best:
                best = prev[j]
            diag = above
    return best / max(1, min(len(A), len(B)))


def _build_index() -> dict[str, Any]:
    data = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    entries = data.get("entries") or []
    if not entries:
        raise RuntimeError("kb_data.json 为空，请先运行 node scripts/export-kb.js")

    docs = []
    for e in entries:
        # 标题重复一次 = 标题字段权重 ×2，与前端 bm25Index 一致
        toks = token_list(f"{e['title']} {e['title']} {' '.join(e.get('tags') or [])} {e['content']}")
        tf: dict[str, int] = {}
        for t in toks:
            tf[t] = tf.get(t, 0) + 1
        docs.append({"tf": tf, "len": len(toks)})

    df: dict[str, int] = {}
    for d in docs:
        for t in d["tf"]:
            df[t] = df.get(t, 0) + 1

    return {
        "entries": entries,
        "docs": docs,
        "df": df,
        "n": len(docs),
        "avgdl": sum(d["len"] for d in docs) / max(1, len(docs)),
        "version": data.get("version", 1),
    }


def _get_index() -> dict[str, Any]:
    global _index
    if _index is not None:
        return _index
    with _lock:
        if _index is None:
            _index = _build_index()
    return _index


def reload_index() -> None:
    """测试与热更新用：丢掉缓存，下次检索重新读盘。"""
    global _index
    with _lock:
        _index = None


def stats() -> dict[str, Any]:
    idx = _get_index()
    return {"count": idx["n"], "version": idx["version"]}


def _bm25_scores(q_tokens: list[str], idx: dict[str, Any]) -> list[float]:
    n = idx["n"]
    avgdl = idx["avgdl"] or 1.0
    scores = []
    for d in idx["docs"]:
        s = 0.0
        for t in q_tokens:
            f = d["tf"].get(t)
            if not f:
                continue
            idf = math.log(1 + (n - idx["df"].get(t, 0) + 0.5) / (idx["df"].get(t, 0) + 0.5))
            s += idf * (f * (_K1 + 1)) / (f + _K1 * (1 - _B + _B * d["len"] / avgdl))
        scores.append(s)
    return scores


def search(query: str, k: int = 3) -> list[dict[str, Any]]:
    """返回 top-k 条目及可展示的打分依据（前端用它渲染引用来源）。"""
    q = str(query or "").strip()
    q_tokens = tokenize(q)
    if not q_tokens:
        return []
    k = max(1, min(int(k or 3), _TOPN))

    idx = _get_index()
    scores = _bm25_scores(q_tokens, idx)
    # 先按 BM25 召回 topN 候选，再重排——召回管「有没有」，重排管「排得对不对」
    pool = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:_TOPN]
    pool = [i for i in pool if scores[i] > 0]
    if not pool:
        return []

    max_bm = max(scores[i] for i in pool) or 1.0
    raw_q = q.lower()
    reranked = []
    for i in pool:
        e = idx["entries"][i]
        title = _coverage(q_tokens, e["title"])
        tag = _coverage(q_tokens, " ".join(e.get("tags") or []))
        # 标题里的完整短语比正文里的同样短语更有说服力（×1.0 vs ×0.6）
        phrase = max(lcs_ratio(raw_q, e["title"]), lcs_ratio(raw_q, e["content"]) * 0.6)
        kind = str(e.get("source") or "").split("·")[0]
        type_prior = _TYPE_PRIOR.get(kind, 0.85)
        clen = len(e.get("content") or "")
        len_prior = max(0.0, 1 - abs(clen - _IDEAL_LEN) / (_IDEAL_LEN * 2))
        feat = (_FEAT_W["title"] * title + _FEAT_W["tag"] * tag + _FEAT_W["phrase"] * phrase
                + _FEAT_W["type"] * type_prior + _FEAT_W["len"] * len_prior)
        hybrid = scores[i] / max_bm
        reranked.append({
            "title": e["title"],
            "source": e.get("source") or "",
            "tags": e.get("tags") or [],
            "content": e["content"],
            "score": round(_W_HYBRID * hybrid + _W_FEAT * feat, 4),
            "signals": {
                "bm25": round(hybrid, 3),
                "title": round(title, 3),
                "tag": round(tag, 3),
                "phrase": round(phrase, 3),
            },
        })
    reranked.sort(key=lambda r: r["score"], reverse=True)
    return reranked[:k]
