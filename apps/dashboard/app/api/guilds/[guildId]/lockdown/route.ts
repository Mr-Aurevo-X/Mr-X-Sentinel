import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getQueue } from "@/lib/queues";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const limited = rateLimit(`lockdown:${guildId}`, 4, 60_000);
  if (limited) return limited;
  const { active } = (await req.json()) as { active: boolean };

  await getQueue("guild-lockdown").add(
    "lockdown",
    {
      guildId,
      active: Boolean(active),
      reason: "Dashboard",
      requestedAt: Date.now(),
    },
    { attempts: 3, backoff: { type: "exponential", delay: 3000 } },
  );

  return NextResponse.json({ lockdown: Boolean(active), queued: true });
}
