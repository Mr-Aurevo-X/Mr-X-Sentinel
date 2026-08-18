import { describe, it, expect } from "vitest";
import { assertRestorePayloadGuild, assertRestorePayloadNotEmpty } from "./restoreGuard.js";

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

describe("assertRestorePayloadNotEmpty", () => {
  it("allows a snapshot with channels", () => {
    expect(() => assertRestorePayloadNotEmpty({ channels: [{ id: "c1" }] })).not.toThrow();
  });

  it("rejects an empty or missing channel list", () => {
    expect(() => assertRestorePayloadNotEmpty({ channels: [] })).toThrow(/no channels/i);
    expect(() => assertRestorePayloadNotEmpty({})).toThrow(/no channels/i);
  });
});
