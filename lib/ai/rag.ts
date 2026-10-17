import kb from "@/lib/data/kb.json";
import { fill, loadPrompt } from "./prompts";

/**
 * RAG 检索（MVP 版本）
 * 当前：内置合成知识库 + 轻量 BM25 风格关键词检索
 * Week 2 升级：Supabase pgvector + Embedding + BM25/向量混合检索 + RRF + Rerank
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
    .split(/[\s，。、；：？！,.;:?!()（）[\]{}"'“”]+/)
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

/** 关键词检索：标题命中权重高于正文 */
export function retrieve(query: string, k = 3): KBEntry[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  return ENTRIES.map((entry) => {
    const haystack = `${entry.title} ${entry.tags.join(" ")} ${entry.content}`.toLowerCase();
    const title = entry.title.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (title.includes(t)) score += 2;
      if (haystack.includes(t)) score += 1;
    }
    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.entry);
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
