import { fill, loadPrompt } from "./prompts";
import type { AgentPersona, InterviewMode } from "./personas";
import type { Profile } from "./schema";

/**
 * 组装面试官系统 Prompt：版本化模板 + Agent 人设 + 候选人画像
 * 仅服务端使用（依赖 fs）
 */
export function buildSystemPrompt(
  persona: AgentPersona,
  profile: Profile | null,
  mode: InterviewMode,
): string {
  const template = loadPrompt("interviewer");
  const profileText = profile
    ? [
        `候选人已确认技能：${profile.skills.join("、") || "未知"}`,
        `目标岗位缺口：${profile.gaps.join("、") || "未知"}`,
        `简历-JD 匹配分：${profile.matchScore}/100`,
      ].join("\n")
    : "暂无候选人画像，按通用初级岗位面试，逐步挖掘信息。";
  return fill(template, {
    persona_name: persona.name,
    persona_focus: persona.focus,
    persona_style: persona.style,
    mode,
    profile: profileText,
  });
}
