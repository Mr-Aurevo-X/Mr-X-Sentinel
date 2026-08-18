import { describe, expect, it } from "vitest";
import { discordTokenNeedsRefresh } from "./discord-oauth.js";

describe("discordTokenNeedsRefresh", () => {
  it("does not treat a missing expiresAt as expired", () => {
    expect(discordTokenNeedsRefresh(undefined)).toBe(false);
  });

  it("refreshes when expiry is within the skew window", () => {
    const now = 1_700_000_000_000;
    expect(discordTokenNeedsRefresh(now / 1000, now)).toBe(true);
  });

  it("keeps a token that expires well in the future", () => {
    const now = 1_700_000_000_000;
    expect(discordTokenNeedsRefresh(now / 1000 + 3600, now)).toBe(false);
  });
});
