"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatPointDto } from "@sentinel/shared";
import { CHART, DATA, tooltipStyle } from "./ChartTheme";

export function AreaFlowChart({ data }: { data: StatPointDto[] }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="joinsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DATA.joins} stopOpacity={0.4} />
              <stop offset="95%" stopColor={DATA.joins} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="leavesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DATA.leaves} stopOpacity={0.32} />
              <stop offset="95%" stopColor={DATA.leaves} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={CHART.muted} fontSize={12} tickLine={false} />
          <YAxis yAxisId="flow" stroke={CHART.muted} fontSize={12} tickLine={false} allowDecimals={false} />
          <YAxis
            yAxisId="members"
            orientation="right"
            stroke={DATA.members}
            fontSize={12}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: CHART.text, fontSize: 12 }} />
          <Area
            yAxisId="flow"
            type="monotone"
            dataKey="joins"
            name="Arrivées"
            stroke={DATA.joins}
            fill="url(#joinsFill)"
          />
          <Area
            yAxisId="flow"
            type="monotone"
            dataKey="leaves"
            name="Départs"
            stroke={DATA.leaves}
            fill="url(#leavesFill)"
          />
          <Line
            yAxisId="members"
            type="monotone"
            dataKey="memberCount"
            name="Membres"
            stroke={DATA.members}
            dot={false}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
