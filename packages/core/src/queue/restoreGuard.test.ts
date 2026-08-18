import { describe, it, expect } from "vitest";
import { assertRestorePayloadGuild } from "./restoreGuard.js";

describe("restore guild guard", () => {
  it("allows a matching payload guildId", () => {
    expect(() => assertRestorePayloadGuild("g1", "g1")).not.toThrow();
  });

  it("rejects a missing payload guildId or a different guild", () => {
    expect(() => assertRestorePayloadGuild(undefined, "g1")).toThrow(/mismatch/);
    expect(() => assertRestorePayloadGuild("", "g1")).toThrow(/mismatch/);
    expect(() => assertRestorePayloadGuild("other", "g1")).toThrow(/mismatch/);
  });
});
