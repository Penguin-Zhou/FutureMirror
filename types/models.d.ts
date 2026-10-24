/**
 * 全局类型契约（JSDoc typedef，无运行时代码）
 *
 * 用法：在 JS 里写 `/** @type {InterviewTurn} *\/` 或 `/** @param {Report} r *\/`
 * 即可获得编辑器内的补全与跳转。这些类型与后端 `backend/app/models.py` 的
 * Pydantic 模型一一对应，两侧若漂移，接口用例会先失败。
 */

/** 一轮问答 */
interface InterviewTurn {
  seq?: number;
  /** 提问 Agent 名称，如「技术面试官」 */
  agent: string;
  question: string;
  answer: string;
  /** 候选人自我批注（面试中可实时补充） */
  notes?: string;
  /** 压力面标记 */
  mode?: "normal" | "pressure" | string;
}

/** 单个能力维度得分 */
interface DimensionScore {
  /** 维度标识：depth / logic / expression / fit / stress */
  key: string;
  /** 中文维度名 */
  dimension: string;
  /** 0–100，由确定性引擎给出 */
  score: number;
  /** 该维度的质性评语；配置了 LLM 时由 LLM 生成，失败回退规则评语 */
  comment: string;
  /** 该维度对应的改进任务池 */
  pool?: string[];
}

/** 学习计划条目 */
interface PlanItem {
  day: string;
  task: string;
  tag?: string;
}

/** 报告证据：引用原话 */
interface ReportEvidence {
  agent: string;
  quote: string;
  note?: string;
}

/** 评估报告 */
interface Report {
  total: number;
  dims: DimensionScore[];
  plan: PlanItem[];
  evidence: ReportEvidence[];
  weakest: { dimension: string; score: number };
  /** 教练总评（仅 LLM 增强成功时存在） */
  narrative?: string;
  /** 评分来源标记 */
  scoring?: { engine: "deterministic" | "deterministic+llm" | "heuristic"; llm_enriched?: boolean };
}

/** 简历与岗位匹配结果 */
interface MatchResult {
  matchScore: number;
  gaps: string[];
  matched?: string[];
}

/** 用户档案 */
interface UserProfile {
  name?: string;
  title?: string;
  city?: string;
  years?: number;
  avatar?: { type: "initial" | "image"; value?: string };
  skills?: string[];
}

/** 题库题目 */
interface QuizQuestion {
  id: string;
  cat: string;
  q: string;
  options: string[];
  a: number;
  exp?: string;
  vip?: boolean;
}
