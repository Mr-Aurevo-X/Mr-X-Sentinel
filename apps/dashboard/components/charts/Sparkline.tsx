"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { StatPointDto } from "@sentinel/shared";
import { DATA } from "./ChartTheme";

export function Sparkline({
  data,
  dataKey,
  color = DATA.messages,
}: {
  data: StatPointDto[];
  dataKey: keyof StatPointDto;
  color?: string;
}) {
  return (
    <div className="spark-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
