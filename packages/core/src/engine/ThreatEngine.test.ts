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

  it("logs only when anti-nuke is disabled", () => {
    const disabled = { ...config, antiNuke: { ...config.antiNuke, enabled: false } };
    const decision = engine.evaluate({
      guildId: "1",
      actorId: "user1",
      action: "CHANNEL_DELETE",
      isWhitelisted: false,
      config: disabled,
    });
    expect(decision.actions).toEqual(["LOG"]);
  });

  it("critical for BOT_ADD without rollback", () => {
    const decision = engine.evaluate({
      guildId: "1",
      actorId: "user1",
      action: "BOT_ADD",
      isWhitelisted: false,
      config,
    });
    expect(decision.severity).toBe("CRITICAL");
    expect(decision.shouldRollback).toBe(false);
  });

  it("non-instant actions stay below critical", () => {
    const decision = engine.evaluate({
      guildId: "1",
      actorId: "user1",
      action: "CHANNEL_UPDATE",
      isWhitelisted: false,
      config,
    });
    expect(decision.severity).toBe("LOW");
    expect(decision.actions).toEqual(["LOG"]);
  });
});
