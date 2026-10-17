import { NextResponse } from "next/server";
import { ReportSchema, type Report } from "@/lib/ai/schema";
import { chatJSON, type ChatMessage } from "@/lib/ai/client";
import { resolveProvider, isMock } from "@/lib/ai/providers";
import { fill, loadPrompt } from "@/lib/ai/prompts";
import { maskPII } from "@/lib/ai/safety";

export const runtime = "nodejs";

/** Mock 模式的演示报告（基于最近一轮问答动态生成证据） */
function mockReport(messages: ChatMessage[]): Report {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const quote = lastUser.slice(0, 60) || "（示例回答）";
  return {
    total: 76,
    dimensions: [
      { dimension: "内容深度", score: 74, comment: "项目细节基本清晰，但缺少量化结果支撑" },
      { dimension: "结构逻辑", score: 80, comment: "回答有基本结构，建议强化 STAR 收尾" },
      { dimension: "语言表达", score: 72, comment: "表达流畅，口头禅偏多（Mock 数据）" },
      { dimension: "岗位匹配", score: 78, comment: "核心技能覆盖 JD 主要要求" },
      { dimension: "抗压表现", score: 75, comment: "面对追问保持冷静，偶有防御性表述" },
    ],
    evidence: [
      {
        agent: "技术面试官",
        quote,
        note: "缺少量化数据：建议补充延迟、QPS、用户数等具体指标。",
      },
      {
        agent: "观察员 Agent",
        quote,
        note: "回答结构基本完整，可追问 1-2 个技术细节验证深度。",
      },
    ],
    suggestions: [
      "所有项目成果用量化数据表达（延迟、QPS、转化率、用户数）",
      "用 STAR 结构重讲最强的两个项目，每个项目准备 3 个可深挖的技术点",
      "针对 Dashboard 匹配报告中的缺口技能制定 30 天补强计划",
    ],
    studyPlan: [
      { day: "Day 1", task: "用 STAR 重写简历中最强项目的 300 字介绍" },
      { day: "Day 2", task: "为该项目准备 3 个技术深挖点 + 量化结果" },
      { day: "Day 3", task: "刷 5 道岗位高频八股（参考 RAG 知识库）" },
      { day: "Day 4", task: "完成一次技术面模拟，重点练习系统设计题" },
      { day: "Day 5", task: "完成一次压力面模拟，练习被打断后的恢复" },
      { day: "Day 6", task: "针对报告最弱维度做专项练习" },
      { day: "Day 7", task: "全流程综合模拟一次，对比历史报告看进步曲线" },
    ],
  };
}

export async function POST(req: Request) {
  const body = (await req.json()) as { messages?: ChatMessage[] };
  const messages = body.messages ?? [];
  if (messages.length < 2) {
    return NextResponse.json({ error: "至少需要一轮完整问答" }, { status: 400 });
  }
  const provider = resolveProvider();
  if (isMock(provider)) {
    return NextResponse.json({ ...mockReport(messages), mock: true });
  }
  // 隐私：评估只用脱敏后的对话文本
  const transcript = messages
    .map((m) => `${m.role === "user" ? "候选人" : "面试官"}：${maskPII(m.content).text}`)
    .join("\n");
  try {
    const report = await chatJSON(
      {
        system: fill(loadPrompt("evaluator"), {}),
        messages: [{ role: "user", content: `面试对话记录：\n${transcript}` }],
        temperature: 0.2,
        maxTokens: 2048,
      },
      (raw) => ReportSchema.parse(JSON.parse(raw)),
    );
    return NextResponse.json({ ...report, mock: false });
  } catch {
    return NextResponse.json({ ...mockReport(messages), mock: false, degraded: true });
  }
}
