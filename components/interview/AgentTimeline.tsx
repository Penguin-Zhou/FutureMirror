"use client";

import { AGENTS } from "@/lib/ai/personas";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  agentId: string;
  kind: "question" | "note" | "system";
  text: string;
}

/**
 * Agent 圆桌时间线：实时展示哪个 Agent 在提问 / 观察 / 记录证据
 * 这是演示视频中证明「多 Agent 协作」的核心可视化组件
 */
export function AgentTimeline({
  items,
  thinking,
}: {
  items: TimelineItem[];
  thinking: string | null;
}) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Agent 圆桌时间线
      </p>
      {items.length === 0 && !thinking && (
        <p className="text-sm text-slate-400">面试开始后，这里将实时展示 Agent 协作过程。</p>
      )}
      {items.map((item) => {
        const agent = AGENTS[item.agentId as keyof typeof AGENTS];
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border p-3 text-sm",
              item.kind === "note"
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200 bg-white",
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs font-medium",
                  item.kind === "note"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-brand-50 text-brand-700",
                )}
              >
                {agent?.name ?? "系统"}
              </span>
              <span className="text-xs text-slate-400">
                {item.kind === "note" ? "观察记录" : "提问"}
              </span>
            </div>
            <p className="leading-relaxed text-slate-700">
              {item.kind === "note" ? `📝 ${item.text}` : item.text}
            </p>
          </div>
        );
      })}
      {thinking && (
        <div className="animate-pulse rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-3 text-sm text-brand-700">
          💭 {thinking}
        </div>
      )}
    </div>
  );
}
