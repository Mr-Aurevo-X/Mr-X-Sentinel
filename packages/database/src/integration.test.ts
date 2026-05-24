import { describe, it, expect, beforeAll } from "vitest";
import { prisma, getOrCreateGuild, getGuildConfig } from "./index.js";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe.skipIf(!runIntegration)("database integration", () => {
  const guildId = `test-${Date.now()}`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  it("creates guild with default config", async () => {
    const guild = await getOrCreateGuild(guildId);
    expect(guild.id).toBe(guildId);
    const cfg = await getGuildConfig(guildId);
    expect(cfg.locale).toBe("fr");
  });

  it("upserts user wallet", async () => {
    const wallet = await prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId: "u-test" } },
      create: { guildId, userId: "u-test", cash: 100, bank: 0 },
      update: { cash: 200 },
    });
    expect(wallet.cash).toBe(200);
  });
});
