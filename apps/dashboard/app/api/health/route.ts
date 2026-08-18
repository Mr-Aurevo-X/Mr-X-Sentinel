import { NextResponse } from "next/server";
import { prisma } from "@sentinel/database";
import Redis from "ioredis";

export const dynamic = "force-dynamic";

async function checkDb(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  const url = process.env.REDIS_URL;
  if (!url) return false;
  let redis: Redis | null = null;
  try {
    redis = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    return (await redis.ping()) === "PONG";
  } catch {
    return false;
  } finally {
    await redis?.quit().catch(() => undefined);
  }
}

export async function GET() {
  const [db, redis] = await Promise.all([checkDb(), checkRedis()]);
  const ok = db;
  return NextResponse.json(
    { ok, db, redis, service: "sentinel-dashboard" },
    { status: ok ? 200 : 503 },
  );
}
