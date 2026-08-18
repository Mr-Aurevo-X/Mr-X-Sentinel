import { NextResponse } from "next/server";
import { prisma } from "@sentinel/database";
import {
  aggregateStatRows,
  buildKpis,
  fillHourSeries,
  heatmapCells,
  heatmapDayLabels,
  hourBucketUtc,
  isSeriesEmpty,
  parseStatRange,
  rangeStart,
  serializeStatPoints,
  severitySlices,
  splitKpiWindows,
  topChannelTotals,
  type HourStatRow,
  type SecuritySeverityName,
  type GuildStatsPayload,
} from "@sentinel/shared";
import { assertCanManageGuild } from "@/lib/auth";

function toHourRow(row: {
  hour: Date;
  joins: number;
  leaves: number;
  messages: number;
  uniqueChatters: number;
  automodHits: number;
  cases: number;
  ticketsOpened: number;
  voiceJoins: number;
  voiceMinutes: number;
  memberCount: number;
}): HourStatRow {
  return {
    hour: row.hour,
    joins: row.joins,
    leaves: row.leaves,
    messages: row.messages,
    uniqueChatters: row.uniqueChatters,
    automodHits: row.automodHits,
    cases: row.cases,
    ticketsOpened: row.ticketsOpened,
    voiceJoins: row.voiceJoins,
    voiceMinutes: row.voiceMinutes,
    memberCount: row.memberCount,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;

  const url = new URL(req.url);
  const range = parseStatRange(url.searchParams.get("range"));
  const now = new Date();
  const seriesStart = rangeStart(range, now);
  const kpiStart = new Date(hourBucketUtc(now).getTime() - 14 * 24 * 3_600_000);
  const queryStart = new Date(Math.min(seriesStart.getTime(), kpiStart.getTime()));
  const severitySince = new Date(now.getTime() - 7 * 24 * 3_600_000);

  const [hourRows, channelRows, severityRows] = await Promise.all([
    prisma.guildStatHour.findMany({
      where: { guildId, hour: { gte: queryStart } },
      orderBy: { hour: "asc" },
    }),
    prisma.guildChannelStatHour.findMany({
      where: { guildId, hour: { gte: seriesStart } },
      select: { channelId: true, messages: true },
    }),
    prisma.securityEvent.groupBy({
      by: ["severity"],
      where: { guildId, createdAt: { gte: severitySince } },
      _count: { _all: true },
    }),
  ]);

  const rows = hourRows.map(toHourRow);
  const seriesRows = fillHourSeries(rows, range, now);
  const series = serializeStatPoints(aggregateStatRows(seriesRows, range));
  const windows = splitKpiWindows(rows, now);
  const severityCounts: Partial<Record<SecuritySeverityName, number>> = {};
  for (const row of severityRows) {
    severityCounts[row.severity] = row._count._all;
  }

  const payload: GuildStatsPayload = {
    range,
    series,
    heatmap: heatmapCells(rows, now),
    heatmapDays: heatmapDayLabels(now),
    topChannels: topChannelTotals(channelRows),
    kpis: buildKpis(windows.current, windows.previous),
    severity: severitySlices(severityCounts),
    empty: isSeriesEmpty(seriesRows),
  };

  return NextResponse.json(payload);
}
