"use client";

import { useMemo } from "react";
import { useInterviewStore } from "@/stores/interviewStore";
import { AbilityRadar } from "./RadarChart";
import { Badge, Button, Card } from "@/components/ui";
import type { Report } from "@/lib/ai/schema";

const DEMO_REPORT: Report = {
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
      quote: "我用 Redis 做了缓存，接口明显快了。",
      note: "缺少量化数据：快了多少？命中率？缓存一致性怎么处理的？",
    },
    {
      agent: "HR 面试官",
      quote: "因为贵司平台好，我想来学习。",
      note: "动机表述空泛，建议结合岗位具体内容与个人职业规划。",
    },
  ],
  suggestions: [
    "所有项目成果用量化数据表达（延迟、QPS、转化率、用户数）",
    "用 STAR 结构重讲最强的两个项目，每个项目准备 3 个可深挖的技术点",
    "针对 JD 缺口技能（见 Dashboard 匹配报告）制定 30 天补强计划",
  ],
  studyPlan: [
    { day: "Day 1", task: "用 STAR 重写简历中最强项目的 300 字介绍" },
    { day: "Day 2", task: "为该项目准备 3 个技术深挖点 + 量化结果" },
    { day: "Day 3", task: "刷 5 道岗位高频八股（参考 RAG 知识库）" },
    { day: "Day 4", task: "完成一次技术面模拟，重点练习系统设计题" },
    { day: "Day 5", task: "完成一次压力面模拟，练习被打断后的恢复" },
    { day: "Day 6", task: "针对报告 weakest 维度做专项练习" },
    { day: "Day 7", task: "全流程综合模拟一次，对比历史报告看进步曲线" },
  ],
};

export function ReportView() {
  const { report } = useInterviewStore();
  const data = useMemo(
    () => (report ?? DEMO_REPORT).dimensions.map((d) => ({ dimension: d.dimension, score: d.score })),
    [report],
  );
  const r = report ?? DEMO_REPORT;
  const isDemo = !report;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">评估报告</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isDemo ? "当前展示的是 Mock 演示报告，完成一次模拟面试后将显示你的真实报告。" : "基于本次模拟面试的多模态证据生成"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-brand-600">{r.total}</p>
          <p className="text-xs text-slate-400">综合得分 / 100</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">能力雷达</h2>
          <AbilityRadar data={data} />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">维度得分与评语</h2>
          <div className="space-y-4">
            {r.dimensions.map((d) => (
              <div key={d.dimension}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{d.dimension}</span>
                  <span className="text-slate-500">{d.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{d.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">评分证据（可解释性）</h2>
        <div className="space-y-3">
          {r.evidence.map((e, i) => (
            <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge className="bg-brand-50 text-brand-700">{e.agent}</Badge>
              </div>
              <p className="italic text-slate-700">“{e.quote}”</p>
              <p className="mt-1 text-xs text-slate-500">📝 {e.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">改进建议</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {r.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-500">•</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">7 天学习路径</h2>
          <div className="space-y-2">
            {r.studyPlan.map((p) => (
              <div key={p.day} className="flex gap-3 text-sm">
                <Badge className="shrink-0">{p.day}</Badge>
                <span className="text-slate-700">{p.task}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-center gap-4 pb-8">
        <Button onClick={() => (window.location.href = "/dashboard")}>
          重新开始
        </Button>
      </div>
    </div>
  );
}
