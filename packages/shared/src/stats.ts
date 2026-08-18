export const STAT_RANGES = ["24h", "7d", "30d"] as const;
export type StatRange = (typeof STAT_RANGES)[number];

export const STAT_FIELDS = [
  "joins",
  "leaves",
  "messages",
  "automodHits",
  "cases",
  "ticketsOpened",
  "voiceJoins",
  "voiceMinutes",
] as const;
export type StatField = (typeof STAT_FIELDS)[number];

export type HourStatRow = {
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
};

export type StatPoint = HourStatRow & { label: string };
export type StatPointDto = Omit<StatPoint, "hour"> & { hour: string };

export const KPI_IDS = [
  "messages",
  "memberNet",
  "automodHits",
  "cases",
  "ticketsOpened",
  "voiceMinutes",
] as const;
export type KpiId = (typeof KPI_IDS)[number];

export type GuildKpi = {
  id: KpiId;
  value: number;
  previous: number;
  changePct: number | null;
};

export type TopChannelStat = {
  channelId: string;
  messages: number;
};

export const SECURITY_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type SecuritySeverityName = (typeof SECURITY_SEVERITIES)[number];

export type SeveritySlice = {
  severity: SecuritySeverityName;
  count: number;
};

export type GuildStatsPayload = {
  range: StatRange;
  series: StatPointDto[];
  heatmap: number[][];
  heatmapDays: string[];
  topChannels: TopChannelStat[];
  kpis: GuildKpi[];
  severity: SeveritySlice[];
  empty: boolean;
};

export function hourBucketUtc(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0),
  );
}

export function formatHourStamp(hour: Date): string {
  const y = hour.getUTCFullYear();
  const m = String(hour.getUTCMonth() + 1).padStart(2, "0");
  const d = String(hour.getUTCDate()).padStart(2, "0");
  const h = String(hour.getUTCHours()).padStart(2, "0");
  return `${y}${m}${d}${h}`;
}

export function parseHourStamp(stamp: string): Date | null {
  if (!/^\d{10}$/.test(stamp)) return null;
  const y = Number(stamp.slice(0, 4));
  const m = Number(stamp.slice(4, 6)) - 1;
  const d = Number(stamp.slice(6, 8));
  const h = Number(stamp.slice(8, 10));
  const hour = new Date(Date.UTC(y, m, d, h, 0, 0, 0));
  return Number.isNaN(hour.getTime()) ? null : hour;
}

export function rangeStart(range: StatRange, now = new Date()): Date {
  const end = hourBucketUtc(now);
  switch (range) {
    case "24h":
      return new Date(end.getTime() - 23 * 3_600_000);
    case "7d":
      return new Date(end.getTime() - 7 * 24 * 3_600_000);
    case "30d":
      return new Date(end.getTime() - 30 * 24 * 3_600_000);
    default: {
      const _never: never = range;
      return _never;
    }
  }
}

function emptyRow(hour: Date): HourStatRow {
  return {
    hour,
    joins: 0,
    leaves: 0,
    messages: 0,
    uniqueChatters: 0,
    automodHits: 0,
    cases: 0,
    ticketsOpened: 0,
    voiceJoins: 0,
    voiceMinutes: 0,
    memberCount: 0,
  };
}

function addRows(target: HourStatRow, extra: HourStatRow): void {
  target.joins += extra.joins;
  target.leaves += extra.leaves;
  target.messages += extra.messages;
  target.uniqueChatters += extra.uniqueChatters;
  target.automodHits += extra.automodHits;
  target.cases += extra.cases;
  target.ticketsOpened += extra.ticketsOpened;
  target.voiceJoins += extra.voiceJoins;
  target.voiceMinutes += extra.voiceMinutes;
  target.memberCount = Math.max(target.memberCount, extra.memberCount);
}

export function aggregateStatRows(rows: HourStatRow[], range: StatRange): StatPoint[] {
  if (range === "24h") {
    return [...rows]
      .sort((a, b) => a.hour.getTime() - b.hour.getTime())
      .map((row) => ({
        ...row,
        label: `${String(row.hour.getUTCHours()).padStart(2, "0")}:00`,
      }));
  }
  const byDay = new Map<string, HourStatRow>();
  for (const row of rows) {
    const key = row.hour.toISOString().slice(0, 10);
    const current = byDay.get(key) ?? emptyRow(new Date(`${key}T00:00:00.000Z`));
    addRows(current, row);
    byDay.set(key, current);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => ({
      ...row,
      label: row.hour.toISOString().slice(5, 10),
    }));
}

export function heatmapWindow(now = new Date()): { start: Date; end: Date } {
  const end = hourBucketUtc(now);
  const start = new Date(end.getTime() - 6 * 24 * 3_600_000);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

export function heatmapCells(rows: HourStatRow[], now = new Date()): number[][] {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const { start } = heatmapWindow(now);
  for (const row of rows) {
    if (row.hour < start) continue;
    const day = Math.floor((row.hour.getTime() - start.getTime()) / (24 * 3_600_000));
    if (day < 0 || day > 6) continue;
    grid[day]![row.hour.getUTCHours()] += row.messages;
  }
  return grid;
}

const WEEKDAY_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."] as const;

export function heatmapDayLabels(now = new Date()): string[] {
  const { start } = heatmapWindow(now);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start.getTime() + index * 24 * 3_600_000);
    return WEEKDAY_FR[day.getUTCDay()]!;
  });
}

export function fillHourSeries(rows: HourStatRow[], range: StatRange, now = new Date()): HourStatRow[] {
  const start = rangeStart(range, now);
  const end = hourBucketUtc(now);
  const byHour = new Map(rows.map((row) => [row.hour.getTime(), row]));
  const earlier = [...rows]
    .filter((row) => row.hour < start && row.memberCount > 0)
    .sort((a, b) => b.hour.getTime() - a.hour.getTime())[0];
  const filled: HourStatRow[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += 3_600_000) {
    filled.push(byHour.get(time) ?? emptyRow(new Date(time)));
  }
  if (earlier && filled[0] && filled[0].memberCount === 0) {
    filled[0] = { ...filled[0], memberCount: earlier.memberCount };
  }
  return carryMemberCount(filled);
}

function carryMemberCount(rows: HourStatRow[]): HourStatRow[] {
  let last = 0;
  const forward = rows.map((row) => {
    if (row.memberCount > 0) last = row.memberCount;
    return { ...row, memberCount: row.memberCount > 0 ? row.memberCount : last };
  });
  const firstKnown = forward.find((row) => row.memberCount > 0)?.memberCount ?? 0;
  return forward.map((row) => (row.memberCount > 0 ? row : { ...row, memberCount: firstKnown }));
}

export function kpiValue(rows: HourStatRow[], id: KpiId): number {
  switch (id) {
    case "messages":
      return sumField(rows, "messages");
    case "memberNet":
      return sumField(rows, "joins") - sumField(rows, "leaves");
    case "automodHits":
      return sumField(rows, "automodHits");
    case "cases":
      return sumField(rows, "cases");
    case "ticketsOpened":
      return sumField(rows, "ticketsOpened");
    case "voiceMinutes":
      return sumField(rows, "voiceMinutes");
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

export function kpiChangePct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export function splitKpiWindows(rows: HourStatRow[], now = new Date()): {
  current: HourStatRow[];
  previous: HourStatRow[];
} {
  const end = hourBucketUtc(now);
  const currentStart = new Date(end.getTime() - 7 * 24 * 3_600_000);
  const previousStart = new Date(end.getTime() - 14 * 24 * 3_600_000);
  return {
    current: rows.filter((row) => row.hour >= currentStart && row.hour <= end),
    previous: rows.filter((row) => row.hour >= previousStart && row.hour < currentStart),
  };
}

export function buildKpis(current: HourStatRow[], previous: HourStatRow[]): GuildKpi[] {
  return KPI_IDS.map((id) => {
    const value = kpiValue(current, id);
    const prev = kpiValue(previous, id);
    return { id, value, previous: prev, changePct: kpiChangePct(value, prev) };
  });
}

export function isSeriesEmpty(rows: HourStatRow[]): boolean {
  return rows.every(
    (row) =>
      row.joins === 0 &&
      row.leaves === 0 &&
      row.messages === 0 &&
      row.automodHits === 0 &&
      row.cases === 0 &&
      row.ticketsOpened === 0 &&
      row.voiceMinutes === 0,
  );
}

export function serializeStatPoints(points: StatPoint[]): StatPointDto[] {
  return points.map((point) => ({ ...point, hour: point.hour.toISOString() }));
}

export function topChannelTotals(
  rows: { channelId: string; messages: number }[],
  limit = 8,
): TopChannelStat[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.channelId, (totals.get(row.channelId) ?? 0) + row.messages);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([channelId, messages]) => ({ channelId, messages }));
}

export function severitySlices(counts: Partial<Record<SecuritySeverityName, number>>): SeveritySlice[] {
  return SECURITY_SEVERITIES.map((severity) => ({
    severity,
    count: counts[severity] ?? 0,
  }));
}

export function sumField(rows: HourStatRow[], field: keyof HourStatRow): number {
  return rows.reduce((total, row) => total + (typeof row[field] === "number" ? (row[field] as number) : 0), 0);
}

export function parseStatRange(raw: string | null): StatRange {
  if (raw === "24h" || raw === "7d" || raw === "30d") return raw;
  return "7d";
}
