import { describe, it, expect } from "vitest";
import {
  xpNeededForLevel,
  calculateLevelFromXp,
  getRewardLevel,
  getStreakMultiplier,
  getProgress,
  getRewardRoleName,
} from "./levelMath.js";
import parity from "../../../../../tools/parity-fixtures.json" with { type: "json" };

describe("levelMath", () => {
  it("uses legacy quadratic XP formula", () => {
    expect(xpNeededForLevel(1)).toBe(100);
    expect(xpNeededForLevel(10)).toBe(10_000);
    expect(xpNeededForLevel(100)).toBe(1_000_000);
  });

  it("matches parity fixtures for level from XP", () => {
    for (const { xp, level } of parity.xpLevels) {
      expect(calculateLevelFromXp(xp)).toBe(level);
    }
  });

  it("returns reward milestones at 10/100/1000/10000", () => {
    expect(getRewardLevel(9)).toBeNull();
    expect(getRewardLevel(10)).toBe(10);
    expect(getRewardLevel(99)).toBe(90);
    expect(getRewardLevel(100)).toBe(100);
    expect(getRewardLevel(10000)).toBe(10000);
  });

  it("applies streak multipliers", () => {
    expect(getStreakMultiplier(1)).toBe(1);
    expect(getStreakMultiplier(3)).toBe(3);
    expect(getStreakMultiplier(30)).toBe(3.5);
    expect(getStreakMultiplier(60)).toBe(4);
  });

  it("computes progress within level", () => {
    const { needed, progress } = getProgress(10_500, 10);
    expect(needed).toBe(xpNeededForLevel(11) - xpNeededForLevel(10));
    expect(progress).toBe(500);
  });

  it("generates stable reward role names", () => {
    expect(getRewardRoleName(10)).toMatch(/• 10$/);
    expect(getRewardRoleName(10000)).toBe("✦ Transcendant");
  });
});
