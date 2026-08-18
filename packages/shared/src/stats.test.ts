import { describe, it, expect } from "vitest";
import {
  aggregateStatRows,
  buildKpis,
  fillHourSeries,
  formatHourStamp,
  heatmapCells,
  hourBucketUtc,
  parseHourStamp,
  rangeStart,
  splitKpiWindows,
  type HourStatRow,
} from "./stats.js";

function row(hour: Date, messages: number, extra: Partial<HourStatRow> = {}): HourStatRow {
  return {
    hour,
    joins: 0,
    leaves: 0,
    messages,
    uniqueChatters: 0,
    automodHits: 0,
    cases: 0,
    ticketsOpened: 0,
    voiceJoins: 0,
    voiceMinutes: 0,
    memberCount: 0,
    ...extra,
  };
}

describe("hour stamps", () => {
  it("round-trips UTC hour buckets", () => {
    const hour = hourBucketUtc(new Date("2026-08-17T15:42:11.000Z"));
    expect(hour.toISOString()).toBe("2026-08-17T15:00:00.000Z");
    expect(formatHourStamp(hour)).toBe("2026081715");
    expect(parseHourStamp("2026081715")?.toISOString()).toBe("2026-08-17T15:00:00.000Z");
    expect(parseHourStamp("nope")).toBeNull();
  });
});

describe("aggregateStatRows", () => {
  it("keeps hourly points for 24h and sums days for 7d", () => {
    const a = row(new Date("2026-08-16T10:00:00.000Z"), 3, { joins: 1 });
    const b = row(new Date("2026-08-16T11:00:00.000Z"), 4, { joins: 2 });
    const hourly = aggregateStatRows([b, a], "24h");
    expect(hourly).toHaveLength(2);
    expect(hourly[0]?.label).toBe("10:00");
    expect(hourly[1]?.messages).toBe(4);

    const daily = aggregateStatRows([a, b], "7d");
    expect(daily).toHaveLength(1);
    expect(daily[0]?.messages).toBe(7);
    expect(daily[0]?.joins).toBe(3);
  });
});

describe("rangeStart", () => {
  it("starts 23 hours back for 24h", () => {
    const now = new Date("2026-08-17T15:10:00.000Z");
    expect(rangeStart("24h", now).toISOString()).toBe("2026-08-16T16:00:00.000Z");
  });
});

describe("heatmapCells", () => {
  it("places messages on weekday/hour without using content", () => {
    const now = hourBucketUtc();
    const start = new Date(now.getTime() - 6 * 24 * 3_600_000);
    start.setUTCHours(0, 0, 0, 0);
    const sample = new Date(start);
    sample.setUTCHours(8, 0, 0, 0);
    const grid = heatmapCells([row(sample, 5)], now);
    expect(grid).toHaveLength(7);
    expect(grid[0]).toHaveLength(24);
    expect(grid[0]![8]).toBe(5);
  });
});

describe("fillHourSeries", () => {
  it("fills 24 hourly buckets and carries memberCount", () => {
    const now = new Date("2026-08-17T15:10:00.000Z");
    const filled = fillHourSeries(
      [row(new Date("2026-08-17T15:00:00.000Z"), 2, { memberCount: 42 })],
      "24h",
      now,
    );
    expect(filled).toHaveLength(24);
    expect(filled.at(-1)?.messages).toBe(2);
    expect(filled[0]?.memberCount).toBe(42);
    expect(filled[0]?.messages).toBe(0);
  });
});

describe("buildKpis", () => {
  it("compares the last 7 days to the 7 days before", () => {
    const now = new Date("2026-08-17T15:00:00.000Z");
    const current = row(new Date("2026-08-16T10:00:00.000Z"), 10, { automodHits: 2 });
    const previous = row(new Date("2026-08-08T10:00:00.000Z"), 5, { automodHits: 1 });
    const windows = splitKpiWindows([current, previous], now);
    const kpis = buildKpis(windows.current, windows.previous);
    expect(kpis.find((kpi) => kpi.id === "messages")).toEqual({
      id: "messages",
      value: 10,
      previous: 5,
      changePct: 100,
    });
    expect(kpis.find((kpi) => kpi.id === "automodHits")?.changePct).toBe(100);
  });
});
