import { NextResponse } from "next/server";
import { buildRagContext, ragSystemPrompt } from "@/lib/ai/rag";
import { chatJSON } from "@/lib/ai/client";
import { RagAnswerSchema } from "@/lib/ai/schema";
import { resolveProvider, isMock } from "@/lib/ai/providers";
import { maskPII } from "@/lib/ai/safety";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { query } = (await req.json()) as { query?: string };
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "query 不能为空" }, { status: 400 });
  }
  // 隐私：检索前先脱敏
  const safeQuery = maskPII(query).text;
  const { context, citations } = buildRagContext(safeQuery);
  const provider = resolveProvider();
  if (isMock(provider)) {
    return NextResponse.json({
      answer:
        citations.length > 0
          ? `（Mock 模式）检索到 ${citations.length} 条相关资料，最相关的是「${citations[0].source}」。接入免费 API Key 后，这里将生成带引用的完整回答。`
          : "（Mock 模式）知识库中暂未检索到相关资料，请更换关键词，例如「STAR 法则」「MySQL 索引」。",
      citations,
      mock: true,
    });
  }
  try {
    const answer = await chatJSON(
      {
        system: ragSystemPrompt(),
        messages: [
          {
            role: "user",
            content: `问题：${safeQuery}\n\n可用资料：\n${context || "（无匹配资料）"}`,
          },
        ],
      },
      (raw) => RagAnswerSchema.parse(JSON.parse(raw)),
    );
    return NextResponse.json({ ...answer, mock: false });
  } catch {
    return NextResponse.json({
      answer:
        "模型暂时不可用（免费额度可能已用尽）。以下是检索到的相关资料，请参阅引用来源。",
      citations,
      mock: false,
      degraded: true,
    });
  }
}
