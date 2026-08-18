import { Queue, Worker } from "bullmq";
import type { Client, Guild, NonThreadGuildBasedChannel } from "discord.js";
import { ChannelType, OverwriteType } from "discord.js";
import type { SnapshotPayload } from "@sentinel/shared";
import { prisma } from "@sentinel/database";
import { logger } from "../logger.js";
import { getRedis } from "../redis.js";
import { assertRestorePayloadGuild } from "./restoreGuard.js";
import {
  GUILD_CATEGORY_TYPE,
  keepRestoreOverwrite,
  orderChannelsForRestore,
  remapOverwriteTargetId,
  resolveRestoreParentId,
} from "./restoreMapping.js";

let restoreQueue: Queue | null = null;

function getRestoreQueue(): Queue {
  if (!restoreQueue) {
    restoreQueue = new Queue("snapshot-restore", { connection: getRedis() });
  }
  return restoreQueue;
}

export function startRestoreWorker(getClient: () => Client): Worker {
  return new Worker(
    "snapshot-restore",
    async (job) => {
      const { guildId, snapshotId } = job.data as { guildId: string; snapshotId: string };
      const client = getClient();
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) throw new Error("Guild not found");
      await Promise.all([
        guild.channels.fetch().catch(() => undefined),
        guild.roles.fetch().catch(() => undefined),
        guild.emojis.fetch().catch(() => undefined),
      ]);

      const snap = await prisma.snapshot.findFirst({
        where: { id: snapshotId, guildId },
      });
      if (!snap) throw new Error("Snapshot not found for this guild");

      const payload = snap.payload as unknown as SnapshotPayload;
      assertRestorePayloadGuild(payload.guildId, guild.id);
      await restoreFromSnapshot(guild, payload);
      logger.info({ guildId, snapshotId }, "Snapshot restore completed");
    },
    { connection: getRedis(), concurrency: 1 },
  );
}

/** Restores roles, categories, channels, overwrites, and emojis. Bans and messages stay out of scope. */
export async function restoreFromSnapshot(guild: Guild, payload: SnapshotPayload): Promise<void> {
  const idMap = new Map<string, string>();
  idMap.set(guild.id, guild.id);

  for (const role of payload.roles) {
    const existing = guild.roles.cache.get(role.id);
    if (existing) {
      idMap.set(role.id, existing.id);
      continue;
    }
    try {
      const created = await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: BigInt(role.permissions),
        mentionable: role.mentionable,
        reason: "mr-x-sentinel: Snapshot restore",
      });
      idMap.set(role.id, created.id);
      await delay(500);
    } catch (err) {
      logger.warn({ err, roleName: role.name }, "Role restore failed");
    }
  }

  for (const ch of orderChannelsForRestore(payload.channels)) {
    const existing = guild.channels.cache.get(ch.id);
    if (existing) {
      idMap.set(ch.id, existing.id);
      continue;
    }
    try {
      const parentId = resolveRestoreParentId(ch.parentId, idMap);
      const type = resolveChannelType(ch.type);
      const created = await guild.channels.create({
        name: ch.name,
        type,
        parent: type === ChannelType.GuildCategory ? undefined : (parentId ?? undefined),
        topic: ch.topic ?? undefined,
        nsfw: ch.nsfw,
        rateLimitPerUser: ch.rateLimitPerUser,
        reason: "mr-x-sentinel: Snapshot restore",
      });
      idMap.set(ch.id, created.id);
      await delay(600);
    } catch (err) {
      logger.warn({ err, channelName: ch.name }, "Channel restore failed");
    }
  }

  for (const ch of payload.channels) {
    if (ch.type === GUILD_CATEGORY_TYPE) continue;
    const newId = idMap.get(ch.id) ?? ch.id;
    const channel = guild.channels.cache.get(newId);
    if (!channel || !("setParent" in channel)) continue;
    const parentId = resolveRestoreParentId(ch.parentId, idMap);
    const currentParent = "parentId" in channel ? channel.parentId : null;
    if (currentParent === parentId) continue;
    await channel
      .setParent(parentId, { lockPermissions: false, reason: "mr-x-sentinel: Snapshot restore" })
      .catch((err) => logger.warn({ err, channelId: channel.id }, "Channel reparent failed"));
  }

  const roleIds = new Set(guild.roles.cache.keys());
  for (const ch of payload.channels) {
    const newId = idMap.get(ch.id) ?? ch.id;
    const channel = guild.channels.cache.get(newId) as NonThreadGuildBasedChannel | undefined;
    if (!channel || !("permissionOverwrites" in channel)) continue;
    const overwrites = ch.permissionOverwrites
      .map((overwrite) => ({
        id: remapOverwriteTargetId(overwrite.id, idMap, guild.id),
        type: overwrite.type === 1 ? OverwriteType.Member : OverwriteType.Role,
        allow: BigInt(overwrite.allow),
        deny: BigInt(overwrite.deny),
      }))
      .filter((overwrite) => keepRestoreOverwrite(overwrite, roleIds, guild.id));
    await channel.permissionOverwrites
      .set(overwrites, "mr-x-sentinel: Snapshot restore")
      .catch((err) => logger.warn({ err, channelId: channel.id }, "Overwrite restore failed"));
  }

  for (const emoji of payload.emojis) {
    if (guild.emojis.cache.has(emoji.id)) continue;
    const ext = emoji.animated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${emoji.id}.${ext}`;
    try {
      await guild.emojis.create({
        attachment: url,
        name: emoji.name.slice(0, 32),
        reason: "mr-x-sentinel: Snapshot restore",
      });
      await delay(700);
    } catch (err) {
      logger.warn({ err, emojiName: emoji.name }, "Emoji restore failed");
    }
  }
}

function resolveChannelType(type: number): ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory {
  switch (type) {
    case ChannelType.GuildVoice:
      return ChannelType.GuildVoice;
    case ChannelType.GuildCategory:
      return ChannelType.GuildCategory;
    default:
      return ChannelType.GuildText;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function enqueueRestore(guildId: string, snapshotId: string): Promise<string> {
  const job = await getRestoreQueue().add(
    "restore",
    { guildId, snapshotId },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  );
  return job.id ?? snapshotId;
}
