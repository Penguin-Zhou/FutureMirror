import { NextResponse } from "next/server";
import { resolveProvider } from "@/lib/ai/providers";

export const runtime = "nodejs";

/** 健康检查：前端 Dashboard 用它展示当前模型通道（Mock / 免费额度 / 低价） */
export function GET() {
  const p = resolveProvider();
  return NextResponse.json({
    ok: true,
    provider: p.id,
    label: p.label,
    free: p.free,
    mock: p.id === "mock",
  });
}
