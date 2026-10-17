import { NextResponse } from "next/server";
import { pickSpeaker, INTERVIEW_MODES, type InterviewMode } from "@/lib/ai/personas";
import { buildSystemPrompt } from "@/lib/ai/interviewer";
import { chatStream, type ChatMessage } from "@/lib/ai/client";
import { maskPII } from "@/lib/ai/safety";
import type { Profile } from "@/lib/ai/schema";

export const runtime = "nodejs";

/** 观察员 Agent 的启发式批注（Week 2 替换为 LLM 调用） */
function observerNote(answer: string): string {
  const notes: string[] = [];
  if (answer.length < 30) notes.push("回答过短，信息量不足");
  if (!/\d/.test(answer)) notes.push("缺少量化数据支撑");
  if (answer.length > 400) notes.push("篇幅偏长，注意结构化表达");
  if (/然后|那个|就是/.test(answer)) notes.push("口头禅偏多，影响表达专业度");
  return notes.length > 0 ? notes.join("；") : "结构完整，建议追问细节以验证深度";
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages?: ChatMessage[];
    mode?: string;
    profile?: Profile | null;
  };
  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages 不能为空" }, { status: 400 });
  }
  const mode: InterviewMode = INTERVIEW_MODES.includes(body.mode as InterviewMode)
    ? (body.mode as InterviewMode)
    : "comprehensive";
  const turn = Math.max(0, messages.filter((m) => m.role === "user").length - 1);
  const persona = pickSpeaker(turn, mode);
  const system = buildSystemPrompt(persona, body.profile ?? null, mode);

  // 隐私：只把脱敏后的最近 8 条对话发给模型
  const safeMessages = messages.slice(-8).map((m) => ({
    ...m,
    content: maskPII(m.content).text,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      send("agent", { id: persona.id, name: persona.name, title: persona.title });
      send("thinking", { text: `${persona.name}正在分析你的回答…` });
      let full = "";
      try {
        for await (const delta of chatStream({
          system,
          messages: safeMessages,
          temperature: 0.7,
          maxTokens: 512,
        })) {
          full += delta;
          send("delta", { text: delta });
        }
        const lastUser =
          [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        send("observer", { note: observerNote(lastUser) });
        send("done", { text: full });
      } catch (e) {
        send("error", { message: e instanceof Error ? e.message : "生成失败" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
