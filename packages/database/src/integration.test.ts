import { describe, it, expect, beforeAll } from "vitest";
import { prisma, getOrCreateGuild, getGuildConfig, updateGuildConfig } from "./index.js";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe.skipIf(!runIntegration)("database integration", () => {
  const guildId = `test-${Date.now()}`;
  const userId = `u-${Date.now()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await getOrCreateGuild(guildId);
  });

  it("creates guild with default config", async () => {
    const guild = await getOrCreateGuild(guildId);
    expect(guild.id).toBe(guildId);
    const cfg = await getGuildConfig(guildId);
    expect(cfg.locale).toBe("fr");
  });

  it("upserts user wallet", async () => {
    const created = await prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, cash: 100, bank: 0 },
      update: { cash: 200 },
    });
    expect(created.cash).toBe(100);

    const updated = await prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, cash: 0, bank: 0 },
      update: { cash: 200 },
    });
    expect(updated.cash).toBe(200);
  });

  it("sees the patch on the next getGuildConfig after update", async () => {
    await updateGuildConfig(guildId, { locale: "en" });
    const cfg = await getGuildConfig(guildId);
    expect(cfg.locale).toBe("en");
  });
});
