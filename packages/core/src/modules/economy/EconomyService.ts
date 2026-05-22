import { prisma } from "@sentinel/database";
import type { Client } from "discord.js";
import { logService } from "../../services/LogService.js";

const DAILY_REWARD = 250;
const WORK_MIN = 80;
const WORK_MAX = 350;

export class EconomyService {
  async getOrCreateWallet(guildId: string, userId: string) {
    return prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, cash: 100, bank: 0 },
      update: {},
    });
  }

  async daily(guildId: string, userId: string) {
    const wallet = await this.getOrCreateWallet(guildId, userId);
    const now = new Date();
    if (wallet.lastDaily && now.getTime() - wallet.lastDaily.getTime() < 86_400_000) {
      const next = new Date(wallet.lastDaily.getTime() + 86_400_000);
      throw new Error(`Daily déjà pris. Réessaie <t:${Math.floor(next.getTime() / 1000)}:R>.`);
    }
    const updated = await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: { increment: DAILY_REWARD }, lastDaily: now },
    });
    return { reward: DAILY_REWARD, wallet: updated };
  }

  async work(guildId: string, userId: string) {
    const wallet = await this.getOrCreateWallet(guildId, userId);
    const now = new Date();
    if (wallet.lastWork && now.getTime() - wallet.lastWork.getTime() < 3_600_000) {
      throw new Error("Tu dois attendre 1h entre deux travails.");
    }
    const reward = Math.floor(Math.random() * (WORK_MAX - WORK_MIN + 1)) + WORK_MIN;
    const updated = await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: { increment: reward }, lastWork: now },
    });
    return { reward, wallet: updated };
  }

  async logEconomy(client: Client, guildId: string, title: string, description: string, userId: string) {
    await logService.log(client, guildId, "economy", {
      title,
      description,
      actorId: userId,
    });
  }
}

export const economyService = new EconomyService();
