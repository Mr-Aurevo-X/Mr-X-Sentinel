import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@sentinel/database";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { guildId } = await params;

  const events = await prisma.securityEvent.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ events });
}
