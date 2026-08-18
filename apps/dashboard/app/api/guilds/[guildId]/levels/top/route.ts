import { NextResponse } from "next/server";
import { prisma } from "@sentinel/database";
import { assertCanManageGuild } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const top = await prisma.userXp.findMany({
    where: { guildId },
    orderBy: { xp: "desc" },
    take: 15,
    select: { userId: true, xp: true, level: true },
  });
  return NextResponse.json({ top });
}
