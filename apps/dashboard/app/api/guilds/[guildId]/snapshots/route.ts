import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getQueue } from "@/lib/queues";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const limited = rateLimit(`snapshots:${guildId}`, 3, 300_000);
  if (limited) return limited;

  const job = await getQueue("snapshot-capture").add(
    "capture",
    { guildId, label: "manual" },
    { attempts: 3, backoff: { type: "exponential", delay: 3000 } },
  );

  return NextResponse.json({ jobId: job.id, queued: true });
}
