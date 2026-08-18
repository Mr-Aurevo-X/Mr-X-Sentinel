import {
  aggregateStatRows,
  buildKpis,
  fillHourSeries,
  heatmapCells,
  heatmapDayLabels,
  hourBucketUtc,
  serializeStatPoints,
  severitySlices,
  splitKpiWindows,
  sumField,
  type GuildStatsPayload,
  type HourStatRow,
  type StatRange,
} from "@sentinel/shared";

export const DEMO_CHANNEL_NAMES: Record<string, string> = {
  "demo-general": "général",
  "demo-memes": "memes",
  "demo-clips": "clips",
  "demo-music": "musique",
  "demo-help": "entraide",
  "demo-offtopic": "hors-sujet",
  "demo-events": "events",
  "demo-staff": "staff",
};

const CHANNEL_WEIGHTS: { id: string; weight: number }[] = [
  { id: "demo-general", weight: 0.32 },
  { id: "demo-memes", weight: 0.2 },
  { id: "demo-clips", weight: 0.14 },
  { id: "demo-music", weight: 0.1 },
  { id: "demo-help", weight: 0.08 },
  { id: "demo-offtopic", weight: 0.07 },
  { id: "demo-events", weight: 0.05 },
  { id: "demo-staff", weight: 0.04 },
];

function unit(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function demoHour(hour: Date): HourStatRow {
  const stamp = hour.getTime() / 3_600_000;
  const hourUtc = hour.getUTCHours();
  const weekday = hour.getUTCDay();
  const night = hourUtc < 7;
  const peak = hourUtc >= 18 && hourUtc <= 22;
  const weekend = weekday === 0 || weekday === 6;
  const activity = night ? 0.16 : peak ? 1 : 0.48;
  const week = weekend ? 1.22 : 1;
  const noise = 0.72 + unit(stamp) * 0.5;
  const messages = Math.round(34 * activity * week * noise);
  const joins = Math.round((peak ? 2.4 : 0.7) * (0.4 + unit(stamp + 1)) * (weekend ? 1.35 : 1));
  const leaves = Math.round((0.3 + unit(stamp + 2)) * (peak ? 1.6 : 0.8));
  const automodHits = unit(stamp + 3) > 0.82 ? Math.round(1 + unit(stamp + 4) * 3) : 0;
  const cases = unit(stamp + 5) > 0.93 ? 1 : 0;
  const ticketsOpened = unit(stamp + 6) > 0.9 ? 1 : 0;
  const voiceJoins = Math.round((peak ? 4 : night ? 0 : 1.4) * (0.3 + unit(stamp + 7)));
  const voiceMinutes = voiceJoins * Math.round(8 + unit(stamp + 8) * 22);
  const memberCount = 1680 + Math.round((stamp % 720) * 0.35) + joins - leaves;

  return {
    hour,
    joins,
    leaves,
    messages,
    uniqueChatters: Math.max(1, Math.round(messages * 0.42)),
    automodHits,
    cases,
    ticketsOpened,
    voiceJoins,
    voiceMinutes,
    memberCount,
  };
}

export function buildDemoStats(range: StatRange, now = new Date()): GuildStatsPayload {
  const end = hourBucketUtc(now);
  const start = new Date(end.getTime() - 30 * 24 * 3_600_000);
  const rows: HourStatRow[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += 3_600_000) {
    rows.push(demoHour(new Date(time)));
  }
  const seriesRows = fillHourSeries(rows, range, now);
  const windows = splitKpiWindows(rows, now);
  const totalMessages = Math.max(1, sumField(seriesRows, "messages"));

  return {
    range,
    series: serializeStatPoints(aggregateStatRows(seriesRows, range)),
    heatmap: heatmapCells(rows, now),
    heatmapDays: heatmapDayLabels(now),
    topChannels: CHANNEL_WEIGHTS.map((channel) => ({
      channelId: channel.id,
      messages: Math.round(totalMessages * channel.weight),
    })),
    kpis: buildKpis(windows.current, windows.previous),
    severity: severitySlices({ LOW: 46, MEDIUM: 19, HIGH: 8, CRITICAL: 2 }),
    empty: false,
  };
}
