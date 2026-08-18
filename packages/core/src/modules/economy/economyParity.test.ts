import { describe, it, expect } from "vitest";
import parity from "../../../../../tools/parity-fixtures.json" with { type: "json" };

describe("economy parity fixtures", () => {
  it("matches legacy reward constants", () => {
    expect(parity.economy.weeklyReward).toBe(1500);
    expect(parity.economy.monthlyReward).toBe(5000);
  });

  it("uses standard cooldown windows", () => {
    expect(parity.economy.dailyCooldownMs).toBe(86_400_000);
    expect(parity.economy.weeklyCooldownMs).toBe(7 * 86_400_000);
    expect(parity.economy.monthlyCooldownMs).toBe(30 * 86_400_000);
  });
});
