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
  const tickets = await prisma.ticketChannel.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      channelId: true,
      ownerId: true,
      claimedBy: true,
      status: true,
      ticketType: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ tickets });
}
