"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StatPointDto } from "@sentinel/shared";
import { CHART, DATA, tooltipStyle } from "./ChartTheme";

export function MessageAreaChart({ data }: { data: StatPointDto[] }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="messagesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DATA.messages} stopOpacity={0.45} />
              <stop offset="95%" stopColor={DATA.messages} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={CHART.muted} fontSize={12} tickLine={false} />
          <YAxis stroke={CHART.muted} fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="messages"
            name="Messages"
            stroke={DATA.messages}
            fill="url(#messagesFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
