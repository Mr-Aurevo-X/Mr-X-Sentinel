"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SeveritySlice } from "@sentinel/shared";
import { SEVERITY_COLORS, SEVERITY_LABELS, tooltipStyle } from "./ChartTheme";

export function SeverityDonut({ data }: { data: SeveritySlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.count, 0);
  if (total === 0) {
    return <p className="empty">Aucun événement de sécurité sur 7 jours.</p>;
  }
  return (
    <div className="chart-box chart-box-donut">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="severity" innerRadius={52} outerRadius={80} paddingAngle={3}>
            {data.map((slice) => (
              <Cell key={slice.severity} fill={SEVERITY_COLORS[slice.severity]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => {
              const key = String(name) as keyof typeof SEVERITY_LABELS;
              return [value, SEVERITY_LABELS[key] ?? name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {data.map((slice) => (
          <li key={slice.severity}>
            <span className="chart-swatch" style={{ background: SEVERITY_COLORS[slice.severity] }} />
            {SEVERITY_LABELS[slice.severity]} · {slice.count}
          </li>
        ))}
      </ul>
    </div>
  );
}
