import { describe, it, expect } from "vitest";
import { defaultGuildConfig, guildConfigSchema, parseGuildConfig } from "./config-schema.js";
import {
  defaultGuildFeatures,
  isParkedFeatureKey,
  stripParkedFeaturePatch,
  visibleGuildFeatures,
} from "./features.js";

describe("config-schema", () => {
  it("defaultGuildConfig passes Zod", () => {
    const cfg = defaultGuildConfig();
    expect(guildConfigSchema.safeParse(cfg).success).toBe(true);
    expect(cfg.locale).toBe("fr");
  });

  it("rejects invalid economy bounds", () => {
    const base = defaultGuildConfig();
    const result = guildConfigSchema.safeParse({
      ...base,
      economy: { ...base.economy, dailyMin: -1 },
    });
    expect(result.success).toBe(false);
  });

  it("parseGuildConfig merges partial overrides", () => {
    const cfg = parseGuildConfig({ locale: "en", economy: { dailyMin: 200 } });
    expect(cfg.locale).toBe("en");
    expect(cfg.economy.dailyMin).toBe(200);
  });
});

describe("parked features", () => {
  it("hides ai and brain from visible lists", () => {
    const features = defaultGuildFeatures();
    const keys = visibleGuildFeatures(features).map(([key]) => key);
    expect(keys).not.toContain("ai");
    expect(keys).not.toContain("brain");
    expect(isParkedFeatureKey("ai")).toBe(true);
    expect(isParkedFeatureKey("music")).toBe(false);
  });

  it("strips parked keys from a feature patch", () => {
    const stripped = stripParkedFeaturePatch({ music: true, ai: true, brain: true });
    expect(stripped).toEqual({ music: true });
  });
});
