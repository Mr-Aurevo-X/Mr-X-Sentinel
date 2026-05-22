import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { guildId } = await params;
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
