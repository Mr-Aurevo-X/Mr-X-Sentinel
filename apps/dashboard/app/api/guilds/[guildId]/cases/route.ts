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
  const cases = await prisma.modCase.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      caseNumber: true,
      type: true,
      targetId: true,
      moderatorId: true,
      reason: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ cases });
}
