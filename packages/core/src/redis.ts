import { Redis as RedisClient } from "ioredis";
import { REDIS_KEYS } from "@sentinel/shared";

export { REDIS_KEYS };

let redis: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (!redis) {
    redis = new RedisClient(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function incrementWindow(
  key: string,
  windowSec: number,
): Promise<number> {
  const r = getRedis();
  const count = await r.incr(key);
  if (count === 1) {
    await r.expire(key, windowSec);
  }
  return count;
}

export async function getThreatScore(guildId: string, userId: string): Promise<number> {
  const val = await getRedis().get(REDIS_KEYS.threatScore(guildId, userId));
  return val ? parseInt(val, 10) : 0;
}

export async function addThreatScore(
  guildId: string,
  userId: string,
  delta: number,
  ttlSec = 3600,
): Promise<number> {
  const key = REDIS_KEYS.threatScore(guildId, userId);
  const r = getRedis();
  const next = await r.incrby(key, delta);
  await r.expire(key, ttlSec);
  return next;
}

export async function publishConfigUpdate(guildId: string): Promise<void> {
  await getRedis().publish(REDIS_KEYS.configChannel(guildId), Date.now().toString());
}

export async function isLockdownActive(guildId: string): Promise<boolean> {
  return (await getRedis().get(REDIS_KEYS.lockdown(guildId))) === "1";
}

export async function setLockdown(guildId: string, active: boolean): Promise<void> {
  const r = getRedis();
  if (active) {
    await r.set(REDIS_KEYS.lockdown(guildId), "1");
  } else {
    await r.del(REDIS_KEYS.lockdown(guildId));
  }
}
