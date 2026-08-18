import { Queue, Worker } from "bullmq";
import type { Client } from "discord.js";
import { logger } from "../logger.js";
import { getRedis } from "../redis.js";
import { lockdownService } from "../services/LockdownService.js";

let lockdownQueue: Queue | null = null;

function getLockdownQueue(): Queue {
  if (!lockdownQueue) {
    lockdownQueue = new Queue("guild-lockdown", { connection: getRedis() });
  }
  return lockdownQueue;
}

/** Stale lockdown toggles must not replay hours later after a worker outage. */
const LOCKDOWN_JOB_MAX_AGE_MS = 15 * 60_000;

export function startLockdownWorker(getClient: () => Client): Worker {
  return new Worker(
    "guild-lockdown",
    async (job) => {
      const { guildId, active, reason, requestedAt } = job.data as {
        guildId: string;
        active: boolean;
        reason?: string;
        requestedAt?: number;
      };
      if (requestedAt && Date.now() - requestedAt > LOCKDOWN_JOB_MAX_AGE_MS) {
        logger.warn({ guildId, active, requestedAt }, "Lockdown job expired, skipping");
        return;
      }
      const client = getClient();
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) throw new Error("Guild not found");
      await guild.channels.fetch().catch(() => undefined);
      if (active) {
        await lockdownService.activate(guild, reason ?? "Dashboard");
      } else {
        await lockdownService.deactivate(guild);
      }
      logger.info({ guildId, active }, "Lockdown job completed");
    },
    { connection: getRedis(), concurrency: 1 },
  );
}

export async function enqueueLockdown(
  guildId: string,
  active: boolean,
  reason = "Dashboard",
): Promise<string> {
  const job = await getLockdownQueue().add(
    "lockdown",
    { guildId, active, reason, requestedAt: Date.now() },
    { attempts: 3, backoff: { type: "exponential", delay: 3000 } },
  );
  return job.id ?? guildId;
}
