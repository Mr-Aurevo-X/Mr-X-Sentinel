import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../redis.js", () => ({
  incrementWindow: vi.fn(),
  addThreatScore: vi.fn().mockResolvedValue(10),
}));

import { incrementWindow } from "../redis.js";
import { ThreatEngine } from "./ThreatEngine.js";
import { defaultGuildConfig } from "@sentinel/shared";

describe("ThreatEngine", () => {
  const engine = new ThreatEngine();
  const config = defaultGuildConfig();

  beforeEach(() => {
    vi.mocked(incrementWindow).mockReset();
  });

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

  it("evaluateWithThreshold escalates when count exceeded", async () => {
    vi.mocked(incrementWindow).mockResolvedValue(5);
    const decision = await engine.evaluateWithThreshold(
      {
        guildId: "1",
        actorId: "user1",
        action: "BAN",
        isWhitelisted: false,
        config,
      },
      "BAN",
    );
    expect(decision.severity).toBe("CRITICAL");
    expect(incrementWindow).toHaveBeenCalled();
  });
});
