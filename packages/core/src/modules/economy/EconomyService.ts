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

  async transfer(
    guildId: string,
    fromId: string,
    toId: string,
    amount: number,
  ) {
    if (amount <= 0) throw new Error("Montant invalide.");
    const from = await this.getOrCreateWallet(guildId, fromId);
    if (from.cash < amount) throw new Error("Fonds insuffisants.");
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId: fromId } },
      data: { cash: { decrement: amount } },
    });
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId: toId } },
      data: { cash: { increment: amount } },
    });
  }

  async rob(guildId: string, thiefId: string, victimId: string) {
    const success = Math.random() < 0.35;
    const victim = await this.getOrCreateWallet(guildId, victimId);
    const amount = Math.min(victim.cash, Math.floor(Math.random() * 400) + 50);
    if (!success || amount <= 0) throw new Error("Braquage raté !");
    await this.transfer(guildId, victimId, thiefId, amount);
    return amount;
  }

  async crime(guildId: string, userId: string) {
    const wallet = await this.getOrCreateWallet(guildId, userId);
    const now = new Date();
    if (wallet.lastCrime && now.getTime() - wallet.lastCrime.getTime() < 7_200_000) {
      throw new Error("Attends 2h entre deux crimes.");
    }
    const caught = Math.random() < 0.4;
    const amount = caught
      ? -Math.floor(Math.random() * 200) - 50
      : Math.floor(Math.random() * 500) + 100;
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: {
        cash: { increment: amount },
        lastCrime: now,
      },
    });
    return { amount, caught };
  }

  async deposit(guildId: string, userId: string, amount: number) {
    const w = await this.getOrCreateWallet(guildId, userId);
    if (w.cash < amount) throw new Error("Pas assez en poche.");
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: { decrement: amount }, bank: { increment: amount } },
    });
  }

  async withdraw(guildId: string, userId: string, amount: number) {
    const w = await this.getOrCreateWallet(guildId, userId);
    if (w.bank < amount) throw new Error("Pas assez en banque.");
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { bank: { decrement: amount }, cash: { increment: amount } },
    });
  }

  async leaderboard(guildId: string, limit = 10) {
    return prisma.userWallet.findMany({
      where: { guildId },
      orderBy: { cash: "desc" },
      take: limit,
    });
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
