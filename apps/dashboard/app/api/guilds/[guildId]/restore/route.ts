import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
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

  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  const queue = new Queue("snapshot-restore", { connection: redis });
  const job = await queue.add("restore", { guildId, snapshotId });
  await queue.close();
  redis.disconnect();

  return NextResponse.json({ jobId: job.id });
}
