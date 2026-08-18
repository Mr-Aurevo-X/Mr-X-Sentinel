import type { Guild, TextChannel } from "discord.js";
import { OverwriteType } from "discord.js";
import { REDIS_KEYS } from "@sentinel/shared";
import { prisma } from "@sentinel/database";
import { getRedis, setLockdown, isLockdownActive } from "../redis.js";
import { logger } from "../logger.js";
import { isLockableGuildChannel, parseLockdownSnapshot, type ChannelLockSnapshot } from "./lockdownState.js";

export class LockdownService {
  async activate(guild: Guild, reason: string): Promise<void> {
    if (await isLockdownActive(guild.id)) return;

    const row = await prisma.guild.findUnique({
      where: { id: guild.id },
      select: { lockdown: true },
    });

    await guild.channels.fetch().catch(() => undefined);
    if (!row?.lockdown) {
      const snapshot = this.captureChannelState(guild);
      await getRedis().set(REDIS_KEYS.lockdownPrev(guild.id), JSON.stringify(snapshot));
    }

    await setLockdown(guild.id, true);
    await prisma.guild.update({
      where: { id: guild.id },
      data: { lockdown: true, raidMode: true },
    });

    const everyone = guild.roles.everyone;
    const tasks: Promise<unknown>[] = [];

    for (const channel of guild.channels.cache.values()) {
      if (!isLockableGuildChannel(channel)) continue;
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
        tasks.push(text.setRateLimitPerUser(60).catch(() => undefined));
      }
    }

    await Promise.allSettled(tasks);

    const guildWithInvites = guild as {
      setInvitesPaused?: (paused: boolean, reason?: string) => Promise<Guild>;
    };
    if (guildWithInvites.setInvitesPaused) {
      await guildWithInvites.setInvitesPaused(true, reason).catch(() => undefined);
    }

    logger.info({ guildId: guild.id, reason }, "Lockdown activated");
  }

  async deactivate(guild: Guild): Promise<void> {
    await guild.channels.fetch().catch(() => undefined);
    const raw = await getRedis().get(REDIS_KEYS.lockdownPrev(guild.id));
    const snapshot = parseLockdownSnapshot(raw);

    const restored = snapshot
      ? await this.restoreChannelState(guild, snapshot)
      : await this.revertLockdownBits(guild);
    if (!restored) {
      logger.warn({ guildId: guild.id }, "Unlock incomplete; keeping previous overwrites");
      return;
    }

    await setLockdown(guild.id, false);
    await prisma.guild.update({
      where: { id: guild.id },
      data: { lockdown: false, raidMode: false },
    });
    await getRedis().del(REDIS_KEYS.lockdownPrev(guild.id));

    const guildWithInvites = guild as { setInvitesPaused?: (paused: boolean) => Promise<Guild> };
    if (guildWithInvites.setInvitesPaused) {
      await guildWithInvites.setInvitesPaused(false).catch(() => undefined);
    }

    logger.info({ guildId: guild.id }, "Lockdown deactivated");
  }

  async isActive(guildId: string): Promise<boolean> {
    return isLockdownActive(guildId);
  }

  private captureChannelState(guild: Guild): ChannelLockSnapshot[] {
    const everyoneId = guild.roles.everyone.id;
    const rows: ChannelLockSnapshot[] = [];
    for (const channel of guild.channels.cache.values()) {
      if (!isLockableGuildChannel(channel)) continue;
      const text = channel as TextChannel;
      const overwrite = text.permissionOverwrites.cache.get(everyoneId);
      rows.push({
        channelId: text.id,
        rateLimitPerUser: "rateLimitPerUser" in text ? (text.rateLimitPerUser ?? 0) : 0,
        hadEveryoneOverwrite: Boolean(overwrite),
        everyoneAllow: overwrite ? overwrite.allow.bitfield.toString() : null,
        everyoneDeny: overwrite ? overwrite.deny.bitfield.toString() : null,
      });
    }
    return rows;
  }

  private async restoreChannelState(guild: Guild, snapshot: ChannelLockSnapshot[]): Promise<boolean> {
    const everyone = guild.roles.everyone;
    let ok = true;
    for (const row of snapshot) {
      const channel = guild.channels.cache.get(row.channelId);
      if (!channel || !isLockableGuildChannel(channel)) continue;
      const text = channel as TextChannel;
      const others = [...text.permissionOverwrites.cache.values()]
        .filter((overwrite) => overwrite.id !== everyone.id)
        .map((overwrite) => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield,
          deny: overwrite.deny.bitfield,
        }));
      if (row.hadEveryoneOverwrite) {
        others.push({
          id: everyone.id,
          type: OverwriteType.Role,
          allow: BigInt(row.everyoneAllow ?? "0"),
          deny: BigInt(row.everyoneDeny ?? "0"),
        });
      }
      const wrote = await text.permissionOverwrites
        .set(others, "mr-x-sentinel: Unlock")
        .then(() => true)
        .catch(() => false);
      if (!wrote) ok = false;
      if ("setRateLimitPerUser" in text) {
        const slow = await text
          .setRateLimitPerUser(row.rateLimitPerUser)
          .then(() => true)
          .catch(() => false);
        if (!slow) ok = false;
      }
    }
    return ok;
  }

  private async revertLockdownBits(guild: Guild): Promise<boolean> {
    const everyone = guild.roles.everyone;
    let ok = true;
    for (const channel of guild.channels.cache.values()) {
      if (!isLockableGuildChannel(channel)) continue;
      const text = channel as TextChannel;
      const wrote = await text.permissionOverwrites
        .edit(everyone, {
          SendMessages: null,
          AddReactions: null,
          CreatePublicThreads: null,
          SendMessagesInThreads: null,
        })
        .then(() => true)
        .catch(() => false);
      if (!wrote) ok = false;
    }
    return ok;
  }
}

export const lockdownService = new LockdownService();
