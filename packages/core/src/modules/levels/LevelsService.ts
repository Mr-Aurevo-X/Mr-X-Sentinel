import { prisma } from "@sentinel/database";
import type { Client } from "discord.js";
import { logService } from "../../services/LogService.js";

function xpForLevel(level: number): number {
  return 5 * level * level + 50 * level + 100;
}

export class LevelsService {
  async getOrCreate(guildId: string, userId: string) {
    return prisma.userXp.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, xp: 0, level: 0 },
      update: {},
    });
  }

  async addMessageXp(guildId: string, userId: string, amount = 15) {
    const row = await this.getOrCreate(guildId, userId);
    let xp = row.xp + amount;
    let level = row.level;
    let leveledUp = false;
    while (xp >= xpForLevel(level + 1)) {
      level += 1;
      leveledUp = true;
    }
    await prisma.userXp.update({
      where: { guildId_userId: { guildId, userId } },
      data: { xp, level, streak: { increment: 1 } },
    });
    return { xp, level, leveledUp };
  }

  async logLevelUp(client: Client, guildId: string, userId: string, level: number) {
    if (level % 5 !== 0 && level < 10) return;
    await logService.log(client, guildId, "levels", {
      title: "Level up",
      description: `<@${userId}> a atteint le niveau **${level}**.`,
      actorId: userId,
    });
  }
}

export const levelsService = new LevelsService();
