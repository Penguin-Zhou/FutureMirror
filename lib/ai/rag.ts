import kb from "@/lib/data/kb.json";
import { fill, loadPrompt } from "./prompts";

/**
 * RAG 检索（混合检索 + 特征重排）
 *
 * 与端侧演示页（frontend/js/data/kb.js）同一套检索策略，两种部署形态：
 *   端侧完整版：BM25 + MiniLM 384d 语义通道 + hashing 兜底 + 融合 + 重排
 *   服务端轻量版（本文件）：BM25 + hashing 256d 稀疏向量 + 融合 + 重排
 *
 * 管线（六个阶段，每阶段产出均可展示为证据）：
 *   ① 分词：英文/数字整词 + 中文 bigram（中文无空格场景的标准做法）
 *   ② BM25：k1=1.5 / b=0.75，标题字段重复计入 = 权重 ×2，IDF 恒正
 *   ③ 向量：有符号特征哈希（256 维）+ L2 归一，零依赖、零网络
 *   ④ 融合：两路各自 min-max 归一后加权（余弦 0.6 / BM25 0.4），
 *      纯语义召回设余弦门槛（hash 通道 0.32，防噪声）
 *   ⑤ 重排：对融合召回的 Top-8 候选，用 5 个可解释词面/结构特征精排
 *      （标题覆盖 / 标签覆盖 / 短语命中 / 类型先验 / 长度先验）
 *   ⑥ 引用：Top-k 条目构建带编号的上下文，答案必须标注来源
 */

export interface KBEntry {
  id: string;
  type: "jd" | "experience" | "star" | "knowledge" | "model";
  title: string;
  source: string;
  tags: string[];
  content: string;
}

const ENTRIES = (kb as { entries: KBEntry[] }).entries;

/* ---------- ① 分词 ---------- */
function isCJK(ch: string): boolean {
  return /[\u4e00-\u9fff]/.test(ch);
}

/**
 * 轻量分词：按标点/空格切分后，对含中文的 token 追加二元词组（bigram）。
 * 中文用户输入通常不带空格（如「字节后端二面一般问什么」），
 * bigram 切分是无分词器方案下 CJK 检索的标准做法。
 */
function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .split(/[\s，。、；：？！,.;:?!()（）[\]{}"'“”…·\u3000]+/)
    .filter((t) => t.length >= 2);
  const tokens = new Set<string>(raw);
  for (const t of raw) {
    if ([...t].some(isCJK)) {
      for (let i = 0; i < t.length - 1; i++) {
        tokens.add(t.slice(i, i + 2));
      }
    }
  }
  return [...tokens];
}

/* ---------- ② BM25（惰性构建，KB 为静态数据只建一次） ---------- */
const BM25_K1 = 1.5;
const BM25_B = 0.75;

interface Bm25Doc {
  tf: Map<string, number>;
  len: number;
}

let bm25Index: { docs: Bm25Doc[]; df: Map<string, number>; N: number; avgdl: number } | null = null;

function bm25(): { docs: Bm25Doc[]; df: Map<string, number>; N: number; avgdl: number } {
  if (bm25Index) return bm25Index;
  const docs: Bm25Doc[] = ENTRIES.map((entry) => {
    // 标题重复一次 = 标题字段权重 ×2
    const list = tokenize(`${entry.title} ${entry.title} ${entry.tags.join(" ")} ${entry.content}`);
    const tf = new Map<string, number>();
    for (const t of list) tf.set(t, (tf.get(t) || 0) + 1);
    return { tf, len: list.length };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  bm25Index = {
    docs,
    df,
    N: docs.length,
    avgdl: docs.reduce((s, d) => s + d.len, 0) / docs.length,
  };
  return bm25Index;
}

function bm25Score(qTokens: string[]): number[] {
  const { docs, df, N, avgdl } = bm25();
  return docs.map((d) => {
    let s = 0;
    for (const t of qTokens) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = df.get(t) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5)); // 恒正，避免高频词负权重
      s += (idf * (f * (BM25_K1 + 1))) / (f + BM25_K1 * (1 - BM25_B + BM25_B * (d.len / avgdl)));
    }
    return s;
  });
}

/* ---------- ③ 向量：有符号特征哈希（256 维） ---------- */
const VEC_DIM = 256;
const W_VEC = 0.6;
const W_BM25 = 0.4;
const MIN_COS_HASH = 0.32; // 纯语义召回的余弦门槛（hash 通道无语义能力，门槛高于 MiniLM 的 0.15）

/** 同一 token 落两个桶一正一负，降低碰撞导致的相似度虚高 */
function hashEmbed(text: string): number[] {
  const v = new Array(VEC_DIM).fill(0);
  const toks = tokenize(text).slice(0, 160);
  for (const tok of toks) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    v[h % VEC_DIM] += 1;
    v[(h >>> 11) % VEC_DIM] -= 1;
  }
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

function docVecText(entry: KBEntry): string {
  return `${entry.title}。${entry.tags.join("、")}。${entry.content}`;
}

let vecCache: number[][] | null = null;
function docVectors(): number[][] {
  if (!vecCache) vecCache = ENTRIES.map((e) => hashEmbed(docVecText(e)));
  return vecCache;
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/* ---------- ④ 融合打分 ---------- */
export interface ScoredHit {
  entry: KBEntry;
  bm25: number;
  bm25Norm: number;
  cos: number;
  score: number; // 融合分 = 余弦×0.6 + BM25归一分×0.4
}

function scoreAll(qTokens: string[]): ScoredHit[] {
  const bm = bm25Score(qTokens);
  const maxBm = bm.reduce((m, x) => Math.max(m, x), 0);
  const vecs = docVectors();
  const queryVec = hashEmbed(qTokens.join(" "));
  const out: ScoredHit[] = [];
  ENTRIES.forEach((entry, i) => {
    const lexical = bm[i] > 0;
    const cos = Math.max(0, cosine(queryVec, vecs[i]));
    if (!lexical && cos < MIN_COS_HASH) return; // 纯语义召回需过门槛
    const bmNorm = maxBm > 0 ? bm[i] / maxBm : 0;
    const score = W_VEC * cos + W_BM25 * bmNorm;
    if (score <= 0.001) return;
    out.push({
      entry,
      bm25: +bm[i].toFixed(3),
      bm25Norm: +bmNorm.toFixed(3),
      cos: +cos.toFixed(3),
      score: +score.toFixed(4),
    });
  });
  return out.sort((a, b) => b.score - a.score);
}

/* ---------- ⑤ 重排：混合召回复用后的精排 ---------- */
/* 为什么需要重排：加权融合假设「余弦高」与「词面准」等价重要，但面试
 * 场景里「标题命中查询意图」几乎总是更强信号——用户搜「MySQL 索引」，
 * 标题含这四个字的条目应排在只在正文提及的条目前面。重排把这类可解释
 * 的词面/结构特征显式建模，每个特征的得分都随引用展示。 */
const RERANK_TOP_N = 8;
const W_HYBRID = 0.55;
const W_FEAT = 0.45;
const FEAT_W = { title: 0.34, tag: 0.22, phrase: 0.24, type: 0.12, len: 0.08 };
const TYPE_PRIOR: Record<string, number> = {
  合成面经: 1.0,
  合成JD: 0.95,
  合成题库: 0.9,
  合成指南: 0.85,
  合成报告: 0.8,
};
const IDEAL_LEN = 170;

/** 查询词在文本中的覆盖率 [0,1]（bigram 已含在 tokens 中） */
function coverage(tokens: string[], text: string): number {
  if (!tokens.length || !text) return 0;
  const t = text.toLowerCase();
  let hit = 0;
  for (const tok of tokens) if (t.includes(tok)) hit++;
  return hit / tokens.length;
}

/** 最长公共子串占比：query 与目标文本的 LCS 长度 / 较短串长度 */
function lcsRatio(a: string, b: string): number {
  if (!a || !b) return 0;
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  const prev = new Array(B.length + 1).fill(0);
  let best = 0;
  for (let i = 1; i <= A.length; i++) {
    let diag = 0;
    for (let j = 1; j <= B.length; j++) {
      const above = prev[j];
      prev[j] = A[i - 1] === B[j - 1] ? diag + 1 : 0;
      if (prev[j] > best) best = prev[j];
      diag = above;
    }
  }
  return best / Math.max(1, Math.min(A.length, B.length));
}

export interface RerankFeat {
  title: number;
  tag: number;
  phrase: number;
  type: number;
  len: number;
}

export interface RankedHit extends ScoredHit {
  feat: RerankFeat;
  featScore: number;
  hybridNorm: number;
  final: number; // 重排分 = 0.55×混合归一分 + 0.45×特征分
}

function rerank(query: string, pool: ScoredHit[]): RankedHit[] {
  if (!pool.length) return [];
  const qToks = tokenize(query);
  const rawQ = query.trim().toLowerCase();
  const maxHybrid = pool.reduce((m, r) => Math.max(m, r.score), 0) || 1;
  return pool
    .map((r) => {
      const e = r.entry;
      const title = coverage(qToks, e.title);
      const tag = coverage(qToks, e.tags.join(" "));
      // 标题中的完整短语比正文中的同样短语更有说服力（×1.0 vs ×0.6）
      const phrase = Math.max(lcsRatio(rawQ, e.title), lcsRatio(rawQ, e.content) * 0.6);
      const type = TYPE_PRIOR[e.source.split("·")[0]] ?? 0.85;
      const len = Math.max(
        0,
        1 - Math.abs(e.content.length - IDEAL_LEN) / (IDEAL_LEN * 2),
      );
      const featScore =
        FEAT_W.title * title +
        FEAT_W.tag * tag +
        FEAT_W.phrase * phrase +
        FEAT_W.type * type +
        FEAT_W.len * len;
      const hybridNorm = r.score / maxHybrid;
      const final = W_HYBRID * hybridNorm + W_FEAT * featScore;
      return {
        ...r,
        feat: {
          title: +title.toFixed(3),
          tag: +tag.toFixed(3),
          phrase: +phrase.toFixed(3),
          type,
          len: +len.toFixed(3),
        },
        featScore: +featScore.toFixed(4),
        hybridNorm: +hybridNorm.toFixed(4),
        final: +final.toFixed(4),
      };
    })
    .sort((a, b) => b.final - a.final);
}

/** 带完整证据分解的检索（混合召回 Top-N → 重排 → top-k） */
export function retrieveScored(query: string, k = 3, topN = RERANK_TOP_N): RankedHit[] {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  return rerank(query, scoreAll(qTokens).slice(0, topN)).slice(0, k);
}

/** 兼容旧接口：返回 entry 列表（已含混合召回 + 重排） */
export function retrieve(query: string, k = 3): KBEntry[] {
  return retrieveScored(query, k).map((r) => r.entry);
}

export interface Citation {
  source: string;
  snippet: string;
}

/** 构建 RAG 上下文：答案必须引用来源，降低幻觉 */
export function buildRagContext(query: string): {
  context: string;
  citations: Citation[];
} {
  const hits = retrieve(query, 3);
  const citations: Citation[] = hits.map((h) => ({
    source: h.source,
    snippet: h.content.slice(0, 80) + "…",
  }));
  const context = hits
    .map((h, i) => `[资料${i + 1}] 来源：${h.source}\n${h.content}`)
    .join("\n\n");
  return { context, citations };
}

/** RAG 系统 Prompt（版本化管理，见 prompts/rag.md） */
export function ragSystemPrompt(): string {
  return fill(loadPrompt("rag"), {});
}
