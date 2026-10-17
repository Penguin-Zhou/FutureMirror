import { resolveProvider } from "./providers";
import { mockStream } from "./mock";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  system?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

function toPayload(provider: { model: string }, opts: ChatOptions) {
  return {
    model: provider.model,
    messages: opts.system
      ? [{ role: "system" as const, content: opts.system }, ...opts.messages]
      : opts.messages,
  };
}

/**
 * 流式对话：统一 OpenAI 兼容协议。
 * 网络错误或非 2xx 响应时自动降级 Mock 流，保证演示不中断。
 */
export async function* chatStream(opts: ChatOptions): AsyncGenerator<string> {
  const provider = resolveProvider();
  if (provider.id === "mock") {
    yield* mockStream(opts);
    return;
  }
  let res: Response;
  try {
    res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        ...toPayload(provider, opts),
        stream: true,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
      }),
      signal: opts.signal,
    });
  } catch {
    yield* mockStream(opts, {
      degraded: true,
      reason: `${provider.label}网络不可达，已切换本地兜底`,
    });
    return;
  }
  if (!res.ok || !res.body) {
    yield* mockStream(opts, {
      degraded: true,
      reason: `${provider.label}返回 ${res.status}（免费额度可能已用尽），已切换本地兜底`,
    });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) yield delta;
      } catch {
        /* 半包忽略 */
      }
    }
  }
}

/**
 * 非流式 JSON 输出：带一次重试，供解析/评估等结构化任务。
 * 注意：调用方需先用 isMock(resolveProvider()) 判断 Mock 模式，
 * Mock 模式下不应调用本函数（见各 API route）。
 */
export async function chatJSON<T>(
  opts: ChatOptions,
  parse: (raw: string) => T,
): Promise<T> {
  const provider = resolveProvider();
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        ...toPayload(provider, opts),
        stream: false,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 2048,
        response_format: { type: "json_object" },
      }),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`${provider.label}返回 ${res.status}`);
    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    try {
      return parse(stripCodeFence(content));
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  throw new Error("chatJSON: 不可达");
}

export function stripCodeFence(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}
