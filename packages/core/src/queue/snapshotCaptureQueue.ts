import { Queue, Worker } from "bullmq";
import type { Client } from "discord.js";
import { parseGuildConfig, REDIS_KEYS } from "@sentinel/shared";
import { prisma } from "@sentinel/database";
import { logger } from "../logger.js";
import { getRedis } from "../redis.js";
import { shouldRunSnapshots } from "../modules/featureGates.js";
import { snapshotService } from "../services/SnapshotService.js";

const AUTO_SNAPSHOT_EVERY_MS = 6 * 60 * 60 * 1000;
const AUTO_SNAPSHOT_LOCK_SEC = 3600;

let captureQueue: Queue | null = null;

function getCaptureQueue(): Queue {
  if (!captureQueue) {
    captureQueue = new Queue("snapshot-capture", { connection: getRedis() });
  }
  return captureQueue;
}

async function tryLockAutoSnapshot(guildId: string): Promise<boolean> {
  const ok = await getRedis().set(REDIS_KEYS.snapshotLock(guildId), "1", "EX", AUTO_SNAPSHOT_LOCK_SEC, "NX");
  return ok === "OK";
}

async function tickAutoSnapshots(): Promise<void> {
  const guilds = await prisma.guild.findMany({ select: { id: true, config: true } });
  for (const guild of guilds) {
    const features = parseGuildConfig(guild.config).features;
    if (!shouldRunSnapshots(features)) continue;
    if (!(await tryLockAutoSnapshot(guild.id))) continue;
    await enqueueSnapshotCapture(guild.id, "auto");
  }
}

export async function scheduleAutoSnapshotTick(): Promise<void> {
  await getCaptureQueue().upsertJobScheduler(
    "auto-snapshots",
    { every: AUTO_SNAPSHOT_EVERY_MS },
    { name: "auto-all", data: {} },
  );
}

export function startSnapshotCaptureWorker(getClient: () => Client): Worker {
  return new Worker(
    "snapshot-capture",
    async (job) => {
      if (job.name === "auto-all") {
        await tickAutoSnapshots();
        return;
      }
      const { guildId, label } = job.data as { guildId: string; label?: string };
      if (!guildId) throw new Error("Guild id required");
      const client = getClient();
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) throw new Error("Guild not found");
      await Promise.all([
        guild.channels.fetch().catch(() => undefined),
        guild.roles.fetch().catch(() => undefined),
        guild.emojis.fetch().catch(() => undefined),
      ]);
      const id = await snapshotService.capture(guild, label ?? "manual");
      logger.info({ guildId, snapshotId: id }, "Snapshot capture completed");
      return id;
    },
    { connection: getRedis(), concurrency: 1 },
  );
}

export async function enqueueSnapshotCapture(guildId: string, label = "manual"): Promise<string> {
  const job = await getCaptureQueue().add(
    "capture",
    { guildId, label },
    { attempts: 3, backoff: { type: "exponential", delay: 3000 } },
  );
  return job.id ?? guildId;
}
