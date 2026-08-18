import { prisma } from "@sentinel/database";
import { getRedis } from "../../redis.js";
import {
  calculateLevelFromXp,
  daysBetween,
  getStreakMultiplier,
  getProgress,
  todayUtc,
  xpNeededForLevel,
} from "./levelMath.js";

const XP_COOLDOWN_SEC = 60;
const XP_MIN = 5;
const XP_MAX = 10;
const WORK_BONUS_MS = 86_400_000;

export type MessageXpResult = {
  xp: number;
  level: number;
  previousLevel: number;
  leveledUp: boolean;
  gainedXp: number;
  streakDays: number;
  streakMultiplier: number;
  skipped: boolean;
  skipReason?: "cooldown" | "empty";
};

export class LevelsService {
  async getOrCreate(guildId: string, userId: string) {
    return prisma.userXp.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, xp: 0, level: 0, streak: 1 },
      update: {},
    });
  }

  getProgress(xp: number, level: number) {
    return getProgress(xp, level);
  }

  /** Alias legacy — XP requis pour un palier de niveau. */
  xpForLevel(level: number): number {
    return xpNeededForLevel(level);
  }

  private async isOnCooldown(guildId: string, userId: string): Promise<boolean> {
    const redis = getRedis();
    const key = `xp:cd:${guildId}:${userId}`;
    const exists = await redis.get(key);
    if (exists) return true;
    await redis.set(key, "1", "EX", XP_COOLDOWN_SEC);
    return false;
  }

  private async getWorkMultiplier(guildId: string, userId: string): Promise<number> {
    const wallet = await prisma.userWallet.findUnique({
      where: { guildId_userId: { guildId, userId } },
      select: { lastWork: true },
    });
    if (!wallet?.lastWork) return 1;
    if (Date.now() - wallet.lastWork.getTime() <= WORK_BONUS_MS) return 2;
    return 1;
  }

  async addMessageXp(guildId: string, userId: string, content?: string): Promise<MessageXpResult> {
    if (content !== undefined && !content.trim()) {
      const row = await this.getOrCreate(guildId, userId);
      return {
        xp: row.xp,
        level: row.level,
        previousLevel: row.level,
        leveledUp: false,
        gainedXp: 0,
        streakDays: row.streak,
        streakMultiplier: getStreakMultiplier(row.streak),
        skipped: true,
        skipReason: "empty",
      };
    }

    if (await this.isOnCooldown(guildId, userId)) {
      const row = await this.getOrCreate(guildId, userId);
      return {
        xp: row.xp,
        level: row.level,
        previousLevel: row.level,
        leveledUp: false,
        gainedXp: 0,
        streakDays: row.streak,
        streakMultiplier: getStreakMultiplier(row.streak),
        skipped: true,
        skipReason: "cooldown",
      };
    }

    const row = await this.getOrCreate(guildId, userId);
    const today = todayUtc();
    let streakDays = row.streak || 1;
    let lastMessageDay = row.lastMessageDay;

    if (!lastMessageDay) {
      streakDays = 1;
      lastMessageDay = today;
    } else {
      const diff = daysBetween(lastMessageDay, today);
      if (diff === 1) {
        streakDays += 1;
        lastMessageDay = today;
      } else if (diff > 1) {
        streakDays = 1;
        lastMessageDay = today;
      } else {
        lastMessageDay = today;
      }
    }

    const streakMultiplier = getStreakMultiplier(streakDays);
    const workMultiplier = await this.getWorkMultiplier(guildId, userId);
    const totalMultiplier = streakMultiplier * workMultiplier;

    const baseGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
    const gainedXp = Math.max(1, Math.round(baseGain * totalMultiplier));

    const previousLevel = row.level;
    const xp = row.xp + gainedXp;
    const level = calculateLevelFromXp(xp);
    const leveledUp = level > previousLevel;

    await prisma.userXp.update({
      where: { guildId_userId: { guildId, userId } },
      data: { xp, level, streak: streakDays, lastMessageDay },
    });

    return {
      xp,
      level,
      previousLevel,
      leveledUp,
      gainedXp,
      streakDays,
      streakMultiplier,
      skipped: false,
    };
  }

  async setXpAndLevel(guildId: string, userId: string, xp: number, level?: number) {
    const safeXp = Math.max(0, xp);
    const computedLevel = level ?? calculateLevelFromXp(safeXp);
    const row = await prisma.userXp.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, xp: safeXp, level: computedLevel, streak: 1 },
      update: { xp: safeXp, level: computedLevel },
    });
    return row;
  }

  async leaderboard(guildId: string, limit = 50) {
    return prisma.userXp.findMany({
      where: { guildId },
      orderBy: [{ level: "desc" }, { xp: "desc" }],
      take: limit,
    });
  }

  async globalLeaderboard(guildId: string, limit = 50) {
    const [xpRows, wallets] = await Promise.all([
      prisma.userXp.findMany({ where: { guildId } }),
      prisma.userWallet.findMany({ where: { guildId } }),
    ]);
    const walletMap = new Map(wallets.map((w) => [w.userId, w.cash + w.bank]));
    return xpRows
      .map((r) => ({
        userId: r.userId,
        level: r.level,
        xp: r.xp,
        score: r.xp + (walletMap.get(r.userId) ?? 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const levelsService = new LevelsService();
