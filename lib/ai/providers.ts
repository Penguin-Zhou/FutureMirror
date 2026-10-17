/**
 * 多模型 Provider 注册表
 * 统一 OpenAI 兼容协议，优先级：免费额度 → 低价 → 自定义 → Mock
 */

export interface ProviderConfig {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  free: boolean;
  docs: string;
}

const MOCK: ProviderConfig = {
  id: "mock",
  label: "本地 Mock（无 API Key 时的演示兜底）",
  baseUrl: "",
  model: "mock-1",
  apiKey: "",
  free: true,
  docs: "",
};

interface Candidate extends Omit<ProviderConfig, "apiKey"> {
  envKeys: string[];
}

const CANDIDATES: Candidate[] = [
  {
    id: "gemini",
    label: "Gemini 免费额度（AI Studio）",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
    envKeys: ["GEMINI_API_KEY"],
    free: true,
    docs: "https://aistudio.google.com/apikey",
  },
  {
    id: "openrouter",
    label: "OpenRouter 免费模型",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "deepseek/deepseek-chat:free",
    envKeys: ["OPENROUTER_API_KEY"],
    free: true,
    docs: "https://openrouter.ai/keys",
  },
  {
    id: "zhipu",
    label: "智谱 GLM（含免费 Flash 模型）",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    envKeys: ["ZHIPU_API_KEY"],
    free: true,
    docs: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  {
    id: "deepseek",
    label: "DeepSeek（低价）",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    envKeys: ["DEEPSEEK_API_KEY"],
    free: false,
    docs: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "custom",
    label: "自定义 OpenAI 兼容服务",
    baseUrl: process.env.AI_BASE_URL ?? "",
    model: process.env.AI_MODEL ?? "",
    envKeys: ["AI_API_KEY"],
    free: false,
    docs: "",
  },
];

/** 解析当前应使用的模型通道；无可用 Key 时返回 Mock */
export function resolveProvider(): ProviderConfig {
  if (process.env.AI_MOCK === "1") return MOCK;
  for (const c of CANDIDATES) {
    const key = c.envKeys.map((k) => process.env[k]).find((v) => v && v.length > 0);
    if (key && c.baseUrl && c.model) {
      return { ...c, apiKey: key };
    }
  }
  return MOCK;
}

export function isMock(p: ProviderConfig): boolean {
  return p.id === "mock";
}
