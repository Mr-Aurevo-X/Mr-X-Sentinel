import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import { updateGuildConfig, getGuildConfig } from "@sentinel/database";
import { guildConfigSchema } from "@sentinel/shared";
import { getSharedRedis } from "@/lib/queues";

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
      ? (body.features as Record<string, unknown>)
      : undefined;
  const parsed = guildConfigSchema.safeParse({
    ...current,
    ...body,
    features: { ...current.features, ...(bodyFeatures ?? {}) },
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid config", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 400 },
    );
  }
  const config = await updateGuildConfig(guildId, parsed.data);

  try {
    await getSharedRedis().publish(`mrx:config:${guildId}`, Date.now().toString());
  } catch {
    // ignore
  }

  return NextResponse.json({ config });
}
