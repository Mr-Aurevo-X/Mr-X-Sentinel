import { Queue, Worker } from "bullmq";
import type { Client, Guild } from "discord.js";
import { ChannelType } from "discord.js";
import type { SnapshotPayload } from "@sentinel/shared";
import { prisma } from "@sentinel/database";
import { logger } from "../logger.js";
import { getRedis } from "../redis.js";

const connection = { connection: getRedis() };

export const restoreQueue = new Queue("snapshot-restore", connection);

export function startRestoreWorker(getClient: () => Client): Worker {
  return new Worker(
    "snapshot-restore",
    async (job) => {
      const { guildId, snapshotId } = job.data as { guildId: string; snapshotId: string };
      const client = getClient();
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) throw new Error("Guild not found");

      const snap = await prisma.snapshot.findUnique({ where: { id: snapshotId } });
      if (!snap) throw new Error("Snapshot not found");

      const payload = snap.payload as unknown as SnapshotPayload;
      await restoreFromSnapshot(guild, payload);
      logger.info({ guildId, snapshotId }, "Snapshot restore completed");
    },
    { ...connection, concurrency: 1 },
  );
}

async function restoreFromSnapshot(guild: Guild, payload: SnapshotPayload): Promise<void> {
  const existingRoleIds = new Set(guild.roles.cache.keys());
  const existingChannelIds = new Set(guild.channels.cache.keys());

  for (const role of payload.roles) {
    if (existingRoleIds.has(role.id)) continue;
    try {
      await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: BigInt(role.permissions),
        mentionable: role.mentionable,
        reason: "mr-x-sentinel: Snapshot restore",
      });
      await delay(500);
    } catch (err) {
      logger.warn({ err, roleName: role.name }, "Role restore failed");
    }
  }

  for (const ch of payload.channels) {
    if (existingChannelIds.has(ch.id)) continue;
    try {
      const type =
        ch.type === ChannelType.GuildText
          ? ChannelType.GuildText
          : ch.type === ChannelType.GuildVoice
            ? ChannelType.GuildVoice
            : ChannelType.GuildText;

      await guild.channels.create({
        name: ch.name,
        type,
        parent: ch.parentId ?? undefined,
        topic: ch.topic ?? undefined,
        nsfw: ch.nsfw,
        rateLimitPerUser: ch.rateLimitPerUser,
        reason: "mr-x-sentinel: Snapshot restore",
      });

      await delay(600);
    } catch (err) {
      logger.warn({ err, channelName: ch.name }, "Channel restore failed");
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function enqueueRestore(guildId: string, snapshotId: string): Promise<string> {
  const job = await restoreQueue.add(
    "restore",
    { guildId, snapshotId },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  );
  return job.id ?? snapshotId;
}
