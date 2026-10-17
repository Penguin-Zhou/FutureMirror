import { NextResponse } from "next/server";
import { ProfileSchema, type Profile } from "@/lib/ai/schema";
import { chatJSON } from "@/lib/ai/client";
import { resolveProvider, isMock } from "@/lib/ai/providers";
import { fill, loadPrompt } from "@/lib/ai/prompts";

export const runtime = "nodejs";

/** MVP 技能词典（Week 2 替换为 LLM 抽取 + 岗位能力模型匹配） */
const SKILL_DICT = [
  "React", "Vue", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "Go",
  "C++", "SQL", "MySQL", "Redis", "Docker", "Kubernetes", "Git", "Linux",
  "机器学习", "深度学习", "PyTorch", "TensorFlow", "LLM", "RAG", "Prompt",
  "Agent", "Next.js", "Tailwind", "Figma", "产品设计", "项目管理", "数据分析",
  "消息队列", "Kafka",
];

/** 无模型时的确定性启发式解析：保证 Mock 模式下 Dashboard 依然可用 */
function heuristicParse(resumeText: string, jdText: string): Profile {
  const resumeSkills = SKILL_DICT.filter((s) => resumeText.includes(s));
  const jdSkills = SKILL_DICT.filter((s) => jdText.includes(s));
  const gaps = jdSkills.filter((s) => !resumeSkills.includes(s));
  const matchScore =
    jdSkills.length > 0
      ? Math.round((100 * (jdSkills.length - gaps.length)) / jdSkills.length)
      : 60;
  return {
    matchScore,
    skills: resumeSkills,
    gaps,
    keywords: jdSkills.slice(0, 8),
    suggestions: [
      ...gaps.slice(0, 3).map((g) => `补强「${g}」：建议通过课程 + 小项目实战，并在简历中补充可量化成果`),
      "用 STAR 结构重写项目经历，每条至少包含一个量化结果",
    ],
  };
}

export async function POST(req: Request) {
  const { resumeText = "", jdText = "" } = (await req.json()) as {
    resumeText?: string;
    jdText?: string;
  };
  if (!resumeText.trim() || !jdText.trim()) {
    return NextResponse.json({ error: "简历与 JD 文本不能为空" }, { status: 400 });
  }
  const provider = resolveProvider();
  if (isMock(provider)) {
    return NextResponse.json({ ...heuristicParse(resumeText, jdText), mock: true });
  }
  try {
    const profile = await chatJSON(
      {
        system: fill(loadPrompt("parser"), {}),
        messages: [
          { role: "user", content: `简历：\n${resumeText}\n\n岗位 JD：\n${jdText}` },
        ],
      },
      (raw) => ProfileSchema.parse(JSON.parse(raw)),
    );
    return NextResponse.json({ ...profile, mock: false });
  } catch {
    return NextResponse.json({
      ...heuristicParse(resumeText, jdText),
      mock: false,
      degraded: true,
    });
  }
}
