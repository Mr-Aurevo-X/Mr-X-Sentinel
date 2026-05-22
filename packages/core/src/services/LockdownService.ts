import type { Guild, TextChannel } from "discord.js";
import { prisma } from "@sentinel/database";
import { setLockdown, isLockdownActive } from "../redis.js";
import { logger } from "../logger.js";

export class LockdownService {
  async activate(guild: Guild, reason: string): Promise<void> {
    if (await isLockdownActive(guild.id)) return;

    await setLockdown(guild.id, true);
    await prisma.guild.update({
      where: { id: guild.id },
      data: { lockdown: true, raidMode: true },
    });

    const everyone = guild.roles.everyone;
    const tasks: Promise<unknown>[] = [];

    for (const channel of guild.channels.cache.values()) {
      if (!channel.isTextBased() || channel.isDMBased()) continue;
      const text = channel as TextChannel;
      tasks.push(
        text.permissionOverwrites
          .edit(everyone, {
            SendMessages: false,
            AddReactions: false,
            CreatePublicThreads: false,
            SendMessagesInThreads: false,
          })
          .catch((err) => logger.warn({ err, channelId: text.id }, "Lockdown channel failed")),
      );
      if ("setRateLimitPerUser" in text) {
        tasks.push(
          text.setRateLimitPerUser(60).catch(() => undefined),
        );
      }
    }

    await Promise.allSettled(tasks);

    // Pause invites when API available (discord.js v14+)
    const guildWithInvites = guild as { setInvitesPaused?: (paused: boolean, reason?: string) => Promise<Guild> };
    if (guildWithInvites.setInvitesPaused) {
      await guildWithInvites.setInvitesPaused(true, reason).catch(() => undefined);
    }

    logger.info({ guildId: guild.id, reason }, "Lockdown activated");
  }

  async deactivate(guild: Guild): Promise<void> {
    await setLockdown(guild.id, false);
    await prisma.guild.update({
      where: { id: guild.id },
      data: { lockdown: false, raidMode: false },
    });

    const everyone = guild.roles.everyone;
    for (const channel of guild.channels.cache.values()) {
      if (!channel.isTextBased() || channel.isDMBased()) continue;
      const text = channel as TextChannel;
      await text.permissionOverwrites
        .delete(everyone)
        .catch(() => undefined);
      if ("setRateLimitPerUser" in text) {
        await text.setRateLimitPerUser(0).catch(() => undefined);
      }
    }

    const guildWithInvites = guild as { setInvitesPaused?: (paused: boolean) => Promise<Guild> };
    if (guildWithInvites.setInvitesPaused) {
      await guildWithInvites.setInvitesPaused(false).catch(() => undefined);
    }

    logger.info({ guildId: guild.id }, "Lockdown deactivated");
  }

  async isActive(guildId: string): Promise<boolean> {
    return isLockdownActive(guildId);
  }
}

export const lockdownService = new LockdownService();
