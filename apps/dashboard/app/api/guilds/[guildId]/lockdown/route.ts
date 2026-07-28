import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import { prisma } from "@sentinel/database";
import Redis from "ioredis";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const { active } = (await req.json()) as { active: boolean };

  await prisma.guild.update({
    where: { id: guildId },
    data: { lockdown: active, raidMode: active },
  });

  try {
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    if (active) {
      await redis.set(`mrx:lockdown:${guildId}`, "1");
    } else {
      await redis.del(`mrx:lockdown:${guildId}`);
    }
    redis.disconnect();
  } catch {
    // ignore
  }

  return NextResponse.json({ lockdown: active });
}
