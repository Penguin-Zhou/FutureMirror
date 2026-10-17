import Link from "next/link";
import { Bot, BookOpen, Mic, MessagesSquare, Radar, ShieldCheck } from "lucide-react";
import { AGENTS } from "@/lib/ai/personas";
import { Badge } from "@/components/ui";

const FEATURES = [
  {
    icon: Bot,
    title: "多 Agent 面试圆桌",
    desc: "HR、技术、压力面、观察员协作提问，基于你的回答动态追问，而非固定题库。",
  },
  {
    icon: Radar,
    title: "可解释评分报告",
    desc: "每个分数附带对话证据与知识引用，输出能力雷达图与 7 天学习路径。",
  },
  {
    icon: BookOpen,
    title: "RAG 面经问答",
    desc: "岗位 JD、面经、STAR 题库混合检索，答案必须带引用来源，降低幻觉。",
  },
  {
    icon: Mic,
    title: "语音模拟面试",
    desc: "Web Speech API 实时听写，端到端流式对话，AI 思考状态全程可见。",
  },
  {
    icon: ShieldCheck,
    title: "隐私优先",
    desc: "本地 PII 脱敏 + Prompt 注入检测，原始简历不上云，支持隐私模式。",
  },
  {
    icon: MessagesSquare,
    title: "Mock 兜底模式",
    desc: "无 API Key 也能完整演示；模型故障自动降级，演示现场不翻车。",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <Badge className="mb-4 bg-brand-50 text-brand-700">
          多 Agent · 可解释评分 · RAG · 多模态
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          面镜 <span className="text-brand-600">FutureMirror</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          多 Agent 驱动的 AI 模拟面试与能力成长平台。上传简历与目标岗位
          JD，由 AI 面试官团队完成模拟面试，生成可解释的评分报告与个性化学习路径。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            开始模拟面试
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            查看 Demo（Mock 模式可跑）
          </Link>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="text-center text-2xl font-semibold">面试圆桌：五个协作 Agent</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.values(AGENTS)
            .filter((a) => a.id !== "observer" && a.id !== "coach")
            .map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Bot className="h-5 w-5" />
                </div>
                <p className="font-medium">{a.name}</p>
                <p className="mt-1 text-xs text-slate-500">{a.title}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <f.icon className="mb-3 h-6 w-6 text-brand-600" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
