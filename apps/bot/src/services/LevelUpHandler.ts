import type { Client, Guild } from "discord.js";
import type { MessageXpResult } from "@sentinel/core";
import { levelRewardService } from "./LevelRewardService.js";
import { levelUpAnnouncer } from "./LevelUpAnnouncer.js";

export async function processLevelUp(
  client: Client,
  guild: Guild,
  userId: string,
  result: Pick<MessageXpResult, "level" | "xp" | "gainedXp" | "streakMultiplier" | "streakDays">,
): Promise<void> {
  const member = await guild.members.fetch(userId).catch(() => null);
  const role = member ? await levelRewardService.apply(member, result.level) : null;

  await levelUpAnnouncer.announce(client, guild, userId, result.level, result.xp, {
    gainedXp: result.gainedXp,
    streakMultiplier: result.streakMultiplier,
    streakDays: result.streakDays,
    unlockedRole: role,
  });
}
