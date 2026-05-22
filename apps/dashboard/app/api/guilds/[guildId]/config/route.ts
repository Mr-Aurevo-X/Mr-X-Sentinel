import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { updateGuildConfig, getGuildConfig } from "@sentinel/database";
import { guildConfigSchema } from "@sentinel/shared";
import Redis from "ioredis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { guildId } = await params;
  const config = await getGuildConfig(guildId);
  return NextResponse.json({ config });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { guildId } = await params;
  const body = await req.json();
  const current = await getGuildConfig(guildId);
  const merged = guildConfigSchema.parse({ ...current, ...body });
  const config = await updateGuildConfig(guildId, merged);

  try {
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    await redis.publish(`mrx:config:${guildId}`, Date.now().toString());
    redis.disconnect();
  } catch {
    // ignore
  }

  return NextResponse.json({ config });
}
