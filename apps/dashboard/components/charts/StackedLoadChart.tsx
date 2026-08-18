"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StatPointDto } from "@sentinel/shared";
import { CHART, DATA, tooltipStyle } from "./ChartTheme";

export function StackedLoadChart({ data }: { data: StatPointDto[] }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={CHART.muted} fontSize={12} tickLine={false} />
          <YAxis stroke={CHART.muted} fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: CHART.text, fontSize: 12 }} />
          <Bar dataKey="automodHits" name="Automod" stackId="load" fill={DATA.automod} />
          <Bar dataKey="cases" name="Cas" stackId="load" fill={DATA.cases} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
