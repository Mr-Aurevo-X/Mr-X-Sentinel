import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import { updateGuildConfig, getGuildConfig } from "@sentinel/database";
import { guildConfigSchema, stripParkedFeaturePatch } from "@sentinel/shared";
import Redis from "ioredis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const config = await getGuildConfig(guildId);
  return NextResponse.json({ config });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const body = (await req.json()) as Record<string, unknown>;
  const current = await getGuildConfig(guildId);
  const bodyFeatures =
    body.features && typeof body.features === "object" && !Array.isArray(body.features)
      ? stripParkedFeaturePatch(body.features as Record<string, unknown>)
      : undefined;
  const merged = guildConfigSchema.parse({
    ...current,
    ...body,
    features: { ...current.features, ...(bodyFeatures ?? {}) },
  });
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
