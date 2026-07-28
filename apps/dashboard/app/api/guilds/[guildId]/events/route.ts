import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import { prisma } from "@sentinel/database";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;

  const events = await prisma.securityEvent.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ events });
}
