import { describe, it, expect } from "vitest";
import { defaultGuildConfig, guildConfigSchema, parseGuildConfig } from "./config-schema.js";

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
