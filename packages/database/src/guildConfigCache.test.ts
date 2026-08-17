import { describe, it, expect } from "vitest";
import { TtlCache } from "./guildConfigCache.js";

describe("TtlCache", () => {
  it("returns a fresh value and expires after TTL", () => {
    let now = 1_000;
    const cache = new TtlCache<string>(5_000, () => now);
    cache.set("g1", "v1");
    expect(cache.get("g1")).toBe("v1");
    now = 6_000;
    expect(cache.get("g1")).toBeUndefined();
  });

  it("delete drops the next read", () => {
    const cache = new TtlCache<string>(60_000);
    cache.set("g1", "stale");
    cache.delete("g1");
    expect(cache.get("g1")).toBeUndefined();
  });
});
