"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface RadarData {
  dimension: string;
  score: number;
}

/** 能力雷达图：五维评估可视化 */
export function AbilityRadar({ data }: { data: RadarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
        <Radar
          name="能力得分"
          dataKey="score"
          stroke="#4f46e5"
          fill="#6366f1"
          fillOpacity={0.35}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
