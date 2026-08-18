import { describe, it, expect } from "vitest";
import { isEconomyRateLimitedCommand } from "./OwnerModifyService.js";

describe("economy UI rate-limit names", () => {
  it("matches slash eco commands and ui: hub prefixes", () => {
    expect(isEconomyRateLimitedCommand("eco")).toBe(true);
    expect(isEconomyRateLimitedCommand("daily")).toBe(true);
    expect(isEconomyRateLimitedCommand("ui:eco")).toBe(true);
    expect(isEconomyRateLimitedCommand("ui:fun")).toBe(true);
    expect(isEconomyRateLimitedCommand("ui:bj")).toBe(true);
    expect(isEconomyRateLimitedCommand("ui:minijeu")).toBe(true);
    expect(isEconomyRateLimitedCommand("ui:ticket")).toBe(false);
  });
});
