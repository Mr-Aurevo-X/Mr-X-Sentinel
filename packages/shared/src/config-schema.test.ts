import { describe, it, expect } from "vitest";
import { defaultGuildConfig, guildConfigSchema, parseGuildConfig } from "./config-schema.js";
import { PANEL_SECTION_CONFIG_KEYS } from "./panel-sections.js";
import { defaultGuildFeatures, isGuildFeatureKey, visibleGuildFeatures } from "./features.js";

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

  it("strips removed ai config from stored JSON", () => {
    const cfg = parseGuildConfig({ ai: { mentionEnabled: true }, features: { ai: true, music: true } });
    expect(cfg).not.toHaveProperty("ai");
    expect(cfg.features).not.toHaveProperty("ai");
    expect(cfg.features.music).toBe(true);
  });

  it("defaults opt-in modules off and anti-nuke to monitor-only", () => {
    const cfg = defaultGuildConfig();
    expect(cfg.features.economy).toBe(false);
    expect(cfg.features.levels).toBe(false);
    expect(cfg.features.fun).toBe(false);
    expect(cfg.features.tickets).toBe(false);
    expect(cfg.features.community).toBe(false);
    expect(cfg.features.music).toBe(false);
    expect(cfg.features.security).toBe(true);
    expect(cfg.features.snapshots).toBe(true);
    expect(cfg.features.automod).toBe(true);
    expect(cfg.features.moderation).toBe(true);
    expect(cfg.features.templates).toBe(true);
    expect(cfg.antiNuke.monitorOnly).toBe(true);
  });

  it("keeps stored feature flags from existing guild JSON", () => {
    const cfg = parseGuildConfig({ features: { music: true, economy: true } });
    expect(cfg.features.music).toBe(true);
    expect(cfg.features.economy).toBe(true);
    expect(cfg.features.security).toBe(true);
  });
});

describe("features", () => {
  it("lists every live module", () => {
    const keys = visibleGuildFeatures(defaultGuildFeatures()).map(([key]) => key);
    expect(keys).toContain("music");
    expect(keys).not.toContain("ai");
    expect(keys).not.toContain("brain");
    expect(isGuildFeatureKey("music")).toBe(true);
    expect(isGuildFeatureKey("ai")).toBe(false);
  });
});

describe("panel sections", () => {
  it("covers every live GuildConfig key", () => {
    const covered = new Set(Object.values(PANEL_SECTION_CONFIG_KEYS).flat());
    for (const key of Object.keys(defaultGuildConfig())) {
      expect(covered.has(key)).toBe(true);
    }
  });
});
