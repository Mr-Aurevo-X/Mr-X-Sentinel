import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpsert, mockUpdate } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@sentinel/database", () => ({
  getGuildConfig: vi.fn().mockResolvedValue({
    economy: { dailyMin: 100, dailyMax: 200, workMin: 50, workMax: 150 },
  }),
  prisma: {
    userWallet: {
      upsert: mockUpsert,
      update: mockUpdate,
    },
  },
}));

vi.mock("./InventoryService.js", () => ({
  inventoryService: {
    hasRobShield: vi.fn().mockResolvedValue(false),
    checkRobPairCooldown: vi.fn().mockResolvedValue(undefined),
    setRobPairCooldown: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../services/LogService.js", () => ({
  logService: { log: vi.fn() },
}));

import { EconomyService } from "./EconomyService.js";

describe("EconomyService", () => {
  const eco = new EconomyService();
  const guildId = "g1";
  const userId = "u1";

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({
      guildId,
      userId,
      cash: 500,
      bank: 0,
      lastDaily: null,
      lastWeekly: null,
      lastMonthly: null,
      lastWork: null,
      lastCrime: null,
    });
    mockUpdate.mockImplementation(({ data }) =>
      Promise.resolve({
        guildId,
        userId,
        cash: typeof data.cash === "object" && data.cash?.increment ? 500 + data.cash.increment : 500,
        bank: 0,
        lastDaily: data.lastDaily ?? null,
        lastWeekly: data.lastWeekly ?? null,
        lastMonthly: data.lastMonthly ?? null,
        lastWork: data.lastWork ?? null,
        lastCrime: data.lastCrime ?? null,
      }),
    );
  });

  it("grants daily within configured bounds", async () => {
    const result = await eco.daily(guildId, userId);
    expect(result.reward).toBeGreaterThanOrEqual(100);
    expect(result.reward).toBeLessThanOrEqual(200);
  });

  it("rejects daily when cooldown active", async () => {
    mockUpsert.mockResolvedValueOnce({
      guildId,
      userId,
      cash: 500,
      bank: 0,
      lastDaily: new Date(),
      lastWeekly: null,
      lastMonthly: null,
      lastWork: null,
      lastCrime: null,
    });
    await expect(eco.daily(guildId, userId)).rejects.toThrow(/Daily/);
  });

  it("weekly pays fixed 1500", async () => {
    const result = await eco.weekly(guildId, userId);
    expect(result.reward).toBe(1500);
  });
});
