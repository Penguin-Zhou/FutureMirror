import type { ChatOptions } from "./client";

export const THINKING_PHRASES = [
  "正在分析你的回答要点…",
  "正在检索岗位能力模型与面经库…",
  "正在生成针对性追问…",
  "正在比对 STAR 结构与岗位要求…",
];

const FOLLOW_UPS: ((k: string) => string)[] = [
  (k) => `你提到「${k}」——这部分你具体负责哪块？遇到的最大难点是什么，怎么解决的？`,
  (k) => `关于「${k}」，能量化一下结果吗？比如延迟降低多少、影响了多少用户？`,
  (k) => `如果重做一次「${k}」，你会在技术选型或协作方式上做什么不同的决策？`,
  (k) => `「${k}」这个方案，当时对比过哪些备选方案？为什么最终选了它？`,
];

function extractKeyword(text: string): string {
  const cleaned = text.replace(/[，。！？、；\s,.!?;]+/g, " ").trim();
  const words = cleaned.split(" ").filter((w) => w.length >= 2);
  return words.slice(0, 3).join("") || "这个项目";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface MockStreamMeta {
  degraded?: boolean;
  reason?: string;
}

/**
 * Mock 流式输出：无 API Key 或模型不可用时保证演示可继续
 * 基于最后一个用户回答的关键词生成确定性追问，模拟真实流式节奏
 */
export async function* mockStream(
  opts: ChatOptions,
  meta: MockStreamMeta = {},
): AsyncGenerator<string> {
  const lastUser = [...opts.messages].reverse().find((m) => m.role === "user");
  const keyword = extractKeyword(lastUser?.content ?? "");
  if (meta.degraded && meta.reason) {
    yield `【系统提示】${meta.reason}\n\n`;
  }
  const template =
    FOLLOW_UPS[
      Math.abs(hash(keyword + opts.messages.length)) % FOLLOW_UPS.length
    ];
  const answer = template(keyword);
  for (const ch of answer) {
    await sleep(16);
    yield ch;
  }
}
