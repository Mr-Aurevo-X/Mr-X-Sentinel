import { NextResponse } from "next/server";
import { parseRestoreMode } from "@sentinel/shared";
import { assertIsGuildOwner } from "@/lib/auth";
import { prisma } from "@sentinel/database";
import { rateLimit } from "@/lib/rate-limit";
import { getQueue } from "@/lib/queues";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertIsGuildOwner(guildId);
  if (denied) return denied;
  const limited = rateLimit(`restore:${guildId}`, 2, 300_000);
  if (limited) return limited;
  const body = (await req.json()) as { snapshotId?: string; mode?: string };
  const snapshotId = body.snapshotId;
  if (!snapshotId || typeof snapshotId !== "string") {
    return NextResponse.json({ error: "snapshotId required" }, { status: 400 });
  }
  const mode = parseRestoreMode(body.mode);

  const snap = await prisma.snapshot.findFirst({
    where: { id: snapshotId, guildId },
    select: { id: true },
  });
  if (!snap) {
    return NextResponse.json({ error: "Snapshot not found for this guild" }, { status: 404 });
  }

  const job = await getQueue("snapshot-restore").add("restore", { guildId, snapshotId, mode });

  return NextResponse.json({ jobId: job.id, mode });
}
