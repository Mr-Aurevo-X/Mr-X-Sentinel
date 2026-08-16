import { prisma } from "@sentinel/database";
import { getRedis, logger } from "@sentinel/core";

const LAVALINK_HOST = process.env.LAVALINK_HOST ?? "127.0.0.1";
const LAVALINK_PORT = process.env.LAVALINK_PORT ?? "2333";

async function checkPostgres(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout 5s")), 5000)),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const redis = getRedis();
    await redis.connect().catch(() => redis);
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

async function checkLavalink(): Promise<boolean> {
  try {
    const res = await fetch(`http://${LAVALINK_HOST}:${LAVALINK_PORT}/version`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runStartupHealthChecks(): Promise<void> {
  const [db, redis, lavalink] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkLavalink(),
  ]);

  const lines = [
    "┌─────────────────────────────────────┐",
    "│     Mr-X Sentinel — Santé boot     │",
    "├─────────────────────────────────────┤",
    `│  PostgreSQL   ${db ? "✅ OK" : "❌ KO"}              │`,
    `│  Redis        ${redis ? "✅ OK" : "❌ KO"}              │`,
    `│  Lavalink     ${lavalink ? "✅ OK" : "⚠️  OFF"}              │`,
    "└─────────────────────────────────────┘",
  ];

  logger.info("\n" + lines.join("\n"));
  logger.info(
    JSON.stringify({
      event: "sentinel_boot_health",
      postgres: db,
      redis,
      lavalink,
      ok: db && redis,
    }),
  );
  if (!db) logger.error("Postgres inaccessible — vérifie DATABASE_URL et docker compose");
  if (!redis) logger.warn("Redis inaccessible — certaines fonctions sécurité limitées");
  if (!lavalink) logger.warn("Lavalink hors ligne — /play indisponible");
}
