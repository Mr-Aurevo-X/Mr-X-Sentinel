import { prisma } from "@sentinel/database";
import { formatMoney } from "@sentinel/shared";
import { getRedis } from "../../redis.js";

const ECO_COMMANDS = new Set([
  "balance",
  "pay",
  "rob",
  "crime",
  "deposit",
  "withdraw",
  "daily",
  "weekly",
  "monthly",
  "work",
  "buy",
  "use",
  "shop",
  "eco",
  "ui:eco",
  "ui:economy",
  "ui:fun",
  "ui:bj",
  "ui:minijeu",
]);

export function isEconomyRateLimitedCommand(command: string): boolean {
  return ECO_COMMANDS.has(command);
}

export class EconomyAntiCheatModule {
  async checkRateLimit(guildId: string, userId: string, command: string): Promise<void> {
    if (!isEconomyRateLimitedCommand(command)) return;
    const redis = getRedis();
    const key = `eco:rl:${guildId}:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 10);
    if (count > 8) {
      throw new Error("Tu utilises les commandes économie trop vite. Attends quelques secondes.");
    }
  }
}

export class OwnerModifyService {
  isOwner(userId: string): boolean {
    const ownerId = process.env.BOT_OWNER_ID;
    return !!ownerId && ownerId === userId;
  }

  async setBalance(guildId: string, userId: string, cash: number, bank: number) {
    return prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, cash, bank },
      update: { cash, bank },
    });
  }

  async setXp(guildId: string, userId: string, xp: number, level: number) {
    return prisma.userXp.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, xp, level },
      update: { xp, level },
    });
  }

  formatWallet(w: { cash: number; bank: number }) {
    return `Cash: ${formatMoney(w.cash)} · Banque: ${formatMoney(w.bank)}`;
  }
}

export const economyAntiCheat = new EconomyAntiCheatModule();
export const ownerModifyService = new OwnerModifyService();
