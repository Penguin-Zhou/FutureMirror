import { z } from "zod";

/** 简历-JD 匹配画像 */
export const ProfileSchema = z.object({
  matchScore: z.number().min(0).max(100),
  skills: z.array(z.string()),
  gaps: z.array(z.string()),
  keywords: z.array(z.string()),
  suggestions: z.array(z.string()),
});
export type Profile = z.infer<typeof ProfileSchema>;

/** 评估报告：五个维度 + 证据 + 建议 + 学习计划 */
export const ReportSchema = z.object({
  total: z.number().min(0).max(100),
  dimensions: z
    .array(
      z.object({
        dimension: z.string(),
        score: z.number().min(0).max(100),
        comment: z.string(),
      }),
    )
    .length(5),
  evidence: z.array(
    z.object({ agent: z.string(), quote: z.string(), note: z.string() }),
  ),
  suggestions: z.array(z.string()),
  studyPlan: z.array(z.object({ day: z.string(), task: z.string() })),
});
export type Report = z.infer<typeof ReportSchema>;

/** RAG 问答：答案必须附引用来源 */
export const RagAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(z.object({ source: z.string(), snippet: z.string() })),
});
export type RagAnswer = z.infer<typeof RagAnswerSchema>;
