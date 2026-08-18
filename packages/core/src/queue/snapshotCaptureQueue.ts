import { Queue, Worker } from "bullmq";
import type { Client } from "discord.js";
import { logger } from "../logger.js";
import { getRedis } from "../redis.js";
import { snapshotService } from "../services/SnapshotService.js";

let captureQueue: Queue | null = null;

function getCaptureQueue(): Queue {
  if (!captureQueue) {
    captureQueue = new Queue("snapshot-capture", { connection: getRedis() });
  }
  return captureQueue;
}

export function startSnapshotCaptureWorker(getClient: () => Client): Worker {
  return new Worker(
    "snapshot-capture",
    async (job) => {
      const { guildId, label } = job.data as { guildId: string; label?: string };
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
