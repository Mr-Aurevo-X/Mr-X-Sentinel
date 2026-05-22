import { describe, it, expect } from "vitest";
import { ThreatEngine } from "./ThreatEngine.js";
import { defaultGuildConfig } from "@sentinel/shared";

describe("ThreatEngine", () => {
  const engine = new ThreatEngine();
  const config = defaultGuildConfig();

  it("returns LOG only for whitelisted actors", () => {
    const decision = engine.evaluate({
      guildId: "1",
      actorId: "user1",
      action: "CHANNEL_DELETE",
      isWhitelisted: true,
      config,
    });
    expect(decision.actions).toEqual(["LOG"]);
    expect(decision.severity).toBe("LOW");
  });

  it("triggers critical for instant channel delete", () => {
    const decision = engine.evaluate({
      guildId: "1",
      actorId: "user1",
      action: "CHANNEL_DELETE",
      isWhitelisted: false,
      config,
    });
    expect(decision.severity).toBe("CRITICAL");
    expect(decision.actions).toContain("QUARANTINE");
    expect(decision.shouldRollback).toBe(true);
  });
});
