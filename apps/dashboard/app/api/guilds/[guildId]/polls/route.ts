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
  const polls = await prisma.poll.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      question: true,
      channelId: true,
      endsAt: true,
      ended: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ polls });
}
