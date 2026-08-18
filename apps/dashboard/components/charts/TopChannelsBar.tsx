"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHANNEL_RANKS, CHART, tooltipStyle } from "./ChartTheme";

export function TopChannelsBar({
  data,
}: {
  data: { name: string; messages: number }[];
}) {
  if (data.length === 0) {
    return <p className="empty">Pas encore de volume par salon.</p>;
  }
  return (
    <div className="chart-box chart-box-tall">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
          <XAxis type="number" stroke={CHART.muted} fontSize={12} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            stroke={CHART.muted}
            fontSize={12}
            tickLine={false}
            width={110}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="messages" name="Messages" radius={[0, 8, 8, 0]}>
            {data.map((row, index) => (
              <Cell key={row.name} fill={CHANNEL_RANKS[index] ?? CHANNEL_RANKS[CHANNEL_RANKS.length - 1]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
