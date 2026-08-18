import { NextResponse } from "next/server";
import { prisma } from "@sentinel/database";
import { assertCanManageGuild, assertIsGuildOwner } from "@/lib/auth";

const SNOWFLAKE = /^\d{17,20}$/;
const LEVELS = new Set(["EXTRA_OWNER", "TRUSTED"]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const body = (await req.json()) as { userId?: string; level?: string };
  const userId = body.userId?.trim() ?? "";
  const level = body.level ?? "TRUSTED";
  if (!SNOWFLAKE.test(userId) || !LEVELS.has(level)) {
    return NextResponse.json({ error: "userId or level invalid" }, { status: 400 });
  }
  if (level === "EXTRA_OWNER") {
    const notOwner = await assertIsGuildOwner(guildId);
    if (notOwner) return notOwner;
  }
  const entry = await prisma.whitelistEntry.upsert({
    where: { guildId_userId: { guildId, userId } },
    create: { guildId, userId, level: level as "EXTRA_OWNER" | "TRUSTED", addedBy: "dashboard" },
    update: { level: level as "EXTRA_OWNER" | "TRUSTED", addedBy: "dashboard" },
  });
  return NextResponse.json({ entry });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const userId = new URL(req.url).searchParams.get("userId") ?? "";
  if (!SNOWFLAKE.test(userId)) {
    return NextResponse.json({ error: "userId invalid" }, { status: 400 });
  }
  const existing = await prisma.whitelistEntry.findUnique({
    where: { guildId_userId: { guildId, userId } },
    select: { level: true },
  });
  if (existing?.level === "EXTRA_OWNER") {
    const notOwner = await assertIsGuildOwner(guildId);
    if (notOwner) return notOwner;
  }
  await prisma.whitelistEntry.deleteMany({ where: { guildId, userId } });
  return NextResponse.json({ ok: true });
}
