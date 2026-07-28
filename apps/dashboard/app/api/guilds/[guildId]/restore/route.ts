import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import { prisma } from "@sentinel/database";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const { snapshotId } = (await req.json()) as { snapshotId: string };
  if (!snapshotId || typeof snapshotId !== "string") {
    return NextResponse.json({ error: "snapshotId required" }, { status: 400 });
  }

  const snap = await prisma.snapshot.findFirst({
    where: { id: snapshotId, guildId },
    select: { id: true },
  });
  if (!snap) {
    return NextResponse.json({ error: "Snapshot not found for this guild" }, { status: 404 });
  }

  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  const queue = new Queue("snapshot-restore", { connection: redis });
  const job = await queue.add("restore", { guildId, snapshotId });
  await queue.close();
  redis.disconnect();

  return NextResponse.json({ jobId: job.id });
}
