import { getOrCreateGuild, prisma } from "@sentinel/database";
import {
  formatHourStamp,
  hourBucketUtc,
  parseHourStamp,
  type StatField,
} from "@sentinel/shared";
import { getRedis } from "../redis.js";
import { logger } from "../logger.js";

const ACTIVE_KEY = "mrx:stat:active";
const RETENTION_MS = 90 * 24 * 3_600_000;

export function statHashKey(guildId: string, stamp: string): string {
  return `mrx:stat:${guildId}:${stamp}`;
}

export function statChatKey(guildId: string, stamp: string): string {
  return `mrx:stat:chat:${guildId}:${stamp}`;
}

export function statChannelKey(guildId: string, stamp: string): string {
  return `mrx:stat:ch:${guildId}:${stamp}`;
}

export function statVoiceKey(guildId: string): string {
  return `mrx:stat:voice:${guildId}`;
}

export function parseActiveId(id: string): { guildId: string; stamp: string } | null {
  const stamp = id.slice(-10);
  const guildId = id.slice(0, -11);
  if (!guildId || !parseHourStamp(stamp)) return null;
  return { guildId, stamp };
}

function currentStamp(now = new Date()): { hour: Date; stamp: string } {
  const hour = hourBucketUtc(now);
  return { hour, stamp: formatHourStamp(hour) };
}

export async function incrementStat(
  guildId: string,
  field: StatField,
  amount = 1,
  extra?: { memberCount?: number; userId?: string; channelId?: string },
): Promise<void> {
  if (amount === 0) return;
  const { stamp } = currentStamp();
  const redis = getRedis();
  const hashKey = statHashKey(guildId, stamp);
  await redis.hincrby(hashKey, field, amount);
  await redis.expire(hashKey, 48 * 3600);
  await redis.sadd(ACTIVE_KEY, `${guildId}:${stamp}`);
  if (extra?.memberCount != null) {
    await redis.hset(hashKey, "memberCount", extra.memberCount);
  }
  if (field === "messages" && extra?.userId) {
    const chatKey = statChatKey(guildId, stamp);
    await redis.sadd(chatKey, extra.userId);
    await redis.expire(chatKey, 48 * 3600);
  }
  if (field === "messages" && extra?.channelId) {
    const chKey = statChannelKey(guildId, stamp);
    await redis.hincrby(chKey, extra.channelId, amount);
    await redis.expire(chKey, 48 * 3600);
  }
}

export function recordMessage(guildId: string, userId: string, channelId: string): void {
  void incrementStat(guildId, "messages", 1, { userId, channelId }).catch((err) =>
    logger.warn({ err, guildId }, "stat message failed"),
  );
}

export function recordJoin(guildId: string, memberCount: number): void {
  void incrementStat(guildId, "joins", 1, { memberCount }).catch((err) =>
    logger.warn({ err, guildId }, "stat join failed"),
  );
}

export function recordLeave(guildId: string, memberCount: number): void {
  void incrementStat(guildId, "leaves", 1, { memberCount }).catch((err) =>
    logger.warn({ err, guildId }, "stat leave failed"),
  );
}

export function recordAutomodHit(guildId: string): void {
  void incrementStat(guildId, "automodHits").catch((err) =>
    logger.warn({ err, guildId }, "stat automod failed"),
  );
}

export function recordCase(guildId: string): void {
  void incrementStat(guildId, "cases").catch((err) => logger.warn({ err, guildId }, "stat case failed"));
}

export function recordTicketOpened(guildId: string): void {
  void incrementStat(guildId, "ticketsOpened").catch((err) =>
    logger.warn({ err, guildId }, "stat ticket failed"),
  );
}

/** Cap per-session voice minutes so stale entries can't inflate stats. */
const VOICE_SESSION_MAX_MINUTES = 24 * 60;

export async function recordVoiceJoin(guildId: string, userId: string): Promise<void> {
  const redis = getRedis();
  await redis.hset(statVoiceKey(guildId), userId, Date.now().toString());
  await redis.expire(statVoiceKey(guildId), 48 * 3600);
  await incrementStat(guildId, "voiceJoins");
}

export async function recordVoiceLeave(guildId: string, userId: string): Promise<void> {
  const redis = getRedis();
  const started = await redis.hget(statVoiceKey(guildId), userId);
  await redis.hdel(statVoiceKey(guildId), userId);
  if (!started) return;
  const minutes = Math.min(
    VOICE_SESSION_MAX_MINUTES,
    Math.max(0, Math.round((Date.now() - Number(started)) / 60_000)),
  );
  if (minutes > 0) await incrementStat(guildId, "voiceMinutes", minutes);
}

function intField(hash: Record<string, string>, key: string): number {
  const raw = hash[key];
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function flushStats(now = new Date()): Promise<number> {
  const redis = getRedis();
  const active = await redis.smembers(ACTIVE_KEY);
  const current = formatHourStamp(hourBucketUtc(now));
  let flushed = 0;

  for (const id of active) {
    const parsed = parseActiveId(id);
    if (!parsed) {
      await redis.srem(ACTIVE_KEY, id);
      continue;
    }
    const { guildId, stamp } = parsed;
    const hour = parseHourStamp(stamp);
    if (!hour) continue;
    const hash = await redis.hgetall(statHashKey(guildId, stamp));
    const uniqueChatters = await redis.scard(statChatKey(guildId, stamp));
    const channels = await redis.hgetall(statChannelKey(guildId, stamp));

    // Expired/empty Redis buckets must not overwrite already-persisted rows with zeros.
    if (Object.keys(hash).length === 0 && uniqueChatters === 0 && Object.keys(channels).length === 0) {
      await redis.srem(ACTIVE_KEY, id);
      continue;
    }
    await getOrCreateGuild(guildId);

    const data = {
      joins: intField(hash, "joins"),
      leaves: intField(hash, "leaves"),
      messages: intField(hash, "messages"),
      uniqueChatters,
      automodHits: intField(hash, "automodHits"),
      cases: intField(hash, "cases"),
      ticketsOpened: intField(hash, "ticketsOpened"),
      voiceJoins: intField(hash, "voiceJoins"),
      voiceMinutes: intField(hash, "voiceMinutes"),
      memberCount: intField(hash, "memberCount"),
    };

    await prisma.guildStatHour.upsert({
      where: { guildId_hour: { guildId, hour } },
      create: { guildId, hour, ...data },
      update: data,
    });

    for (const [channelId, raw] of Object.entries(channels)) {
      const messages = Number(raw) || 0;
      await prisma.guildChannelStatHour.upsert({
        where: { guildId_channelId_hour: { guildId, channelId, hour } },
        create: { guildId, channelId, hour, messages },
        update: { messages },
      });
    }

    if (stamp !== current) {
      await redis.del(statHashKey(guildId, stamp), statChatKey(guildId, stamp), statChannelKey(guildId, stamp));
      await redis.srem(ACTIVE_KEY, id);
    }
    flushed += 1;
  }

  const cutoff = new Date(now.getTime() - RETENTION_MS);
  await prisma.guildStatHour.deleteMany({ where: { hour: { lt: cutoff } } });
  await prisma.guildChannelStatHour.deleteMany({ where: { hour: { lt: cutoff } } });
  return flushed;
}

export const statsIngest = {
  incrementStat,
  recordMessage,
  recordJoin,
  recordLeave,
  recordAutomodHit,
  recordCase,
  recordTicketOpened,
  recordVoiceJoin,
  recordVoiceLeave,
  flushStats,
};
