import { prisma, getGuildConfig } from "@sentinel/database";
import type { Client } from "discord.js";
import { formatMoney } from "@sentinel/shared";
import { logService } from "../../services/LogService.js";
import { inventoryService } from "./InventoryService.js";

const WEEKLY_REWARD = 1500;
const MONTHLY_REWARD = 5000;
const WEEKLY_MS = 7 * 86_400_000;
const MONTHLY_MS = 30 * 86_400_000;

export class EconomyService {
  private async ecoRange(guildId: string, kind: "daily" | "work") {
    const cfg = await getGuildConfig(guildId);
    if (kind === "daily") {
      const min = cfg.economy.dailyMin;
      const max = Math.max(min, cfg.economy.dailyMax);
      return { min, max };
    }
    const min = cfg.economy.workMin;
    const max = Math.max(min, cfg.economy.workMax);
    return { min, max };
  }

  async getOrCreateWallet(guildId: string, userId: string) {
    return prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, cash: 100, bank: 0 },
      update: {},
    });
  }

  async daily(guildId: string, userId: string) {
    const { min, max } = await this.ecoRange(guildId, "daily");
    return this.claimTimedReward(guildId, userId, {
      field: "lastDaily",
      cooldownMs: 86_400_000,
      reward: () => Math.floor(Math.random() * (max - min + 1)) + min,
      cooldownLabel: "Daily",
    });
  }

  async weekly(guildId: string, userId: string) {
    return this.claimTimedReward(guildId, userId, {
      field: "lastWeekly",
      cooldownMs: WEEKLY_MS,
      reward: () => WEEKLY_REWARD,
      cooldownLabel: "Weekly",
    });
  }

  async monthly(guildId: string, userId: string) {
    return this.claimTimedReward(guildId, userId, {
      field: "lastMonthly",
      cooldownMs: MONTHLY_MS,
      reward: () => MONTHLY_REWARD,
      cooldownLabel: "Monthly",
    });
  }

  async work(guildId: string, userId: string) {
    const { min, max } = await this.ecoRange(guildId, "work");
    return this.claimTimedReward(guildId, userId, {
      field: "lastWork",
      cooldownMs: 3_600_000,
      reward: () => Math.floor(Math.random() * (max - min + 1)) + min,
      cooldownLabel: "Travail",
      cooldownError: "Tu dois attendre 1h entre deux travails.",
    });
  }

  private async claimTimedReward(
    guildId: string,
    userId: string,
    opts: {
      field: "lastDaily" | "lastWeekly" | "lastMonthly" | "lastWork";
      cooldownMs: number;
      reward: () => number;
      cooldownLabel: string;
      cooldownError?: string;
    },
  ) {
    const wallet = await this.getOrCreateWallet(guildId, userId);
    const now = new Date();
    const last = wallet[opts.field];
    if (last && now.getTime() - last.getTime() < opts.cooldownMs) {
      const next = new Date(last.getTime() + opts.cooldownMs);
      throw new Error(
        opts.cooldownError ??
          `${opts.cooldownLabel} déjà pris. Réessaie <t:${Math.floor(next.getTime() / 1000)}:R>.`,
      );
    }
    const reward = opts.reward();
    const updated = await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: { increment: reward }, [opts.field]: now },
    });
    return { reward, wallet: updated };
  }

  async transfer(guildId: string, fromId: string, toId: string, amount: number) {
    if (amount <= 0) throw new Error("Montant invalide.");
    const from = await this.getOrCreateWallet(guildId, fromId);
    if (from.cash < amount) throw new Error(`Fonds insuffisants. Solde : ${formatMoney(from.cash)}.`);
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
    if (await inventoryService.hasRobShield(guildId, victimId)) {
      throw new Error("Cette personne est protégée par un bouclier anti-rob.");
    }
    await inventoryService.checkRobPairCooldown(guildId, thiefId, victimId);
    const success = Math.random() < 0.35;
    const victim = await this.getOrCreateWallet(guildId, victimId);
    const amount = Math.min(victim.cash, Math.floor(Math.random() * 400) + 50);
    if (!success || amount <= 0) throw new Error("Braquage raté !");
    await this.transfer(guildId, victimId, thiefId, amount);
    await inventoryService.setRobPairCooldown(guildId, thiefId, victimId);
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
    const updated = await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: { increment: amount }, lastCrime: now },
    });
    return { amount, caught, wallet: updated };
  }

  async deposit(guildId: string, userId: string, amount: number) {
    const w = await this.getOrCreateWallet(guildId, userId);
    if (w.cash < amount) throw new Error(`Pas assez en poche. ${formatMoney(w.cash)} disponible.`);
    return prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: { decrement: amount }, bank: { increment: amount } },
    });
  }

  async withdraw(guildId: string, userId: string, amount: number) {
    const w = await this.getOrCreateWallet(guildId, userId);
    if (w.bank < amount) throw new Error(`Pas assez en banque. ${formatMoney(w.bank)} disponible.`);
    return prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { bank: { decrement: amount }, cash: { increment: amount } },
    });
  }

  async leaderboard(guildId: string, limit = 50) {
    const rows = await prisma.userWallet.findMany({ where: { guildId } });
    return rows
      .map((w) => ({ ...w, total: w.cash + w.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
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
