import { describe, it, expect } from "vitest";
import { assertRestorePayloadGuild } from "./restoreGuard.js";

describe("restore guild guard", () => {
  it("allows missing payload guildId or a matching id", () => {
    expect(() => assertRestorePayloadGuild(undefined, "g1")).not.toThrow();
    expect(() => assertRestorePayloadGuild("g1", "g1")).not.toThrow();
  });

  it("rejects a payload bound to another guild", () => {
    expect(() => assertRestorePayloadGuild("other", "g1")).toThrow(/mismatch/);
  });
});
