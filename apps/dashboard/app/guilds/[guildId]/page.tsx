import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma, getGuildConfig } from "@sentinel/database";
import { Nav } from "@/components/Nav";
import { GuildDashboard } from "@/components/GuildDashboard";
import Redis from "ioredis";

async function getLockdown(guildId: string): Promise<boolean> {
  try {
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    const val = await redis.get(`mrx:lockdown:${guildId}`);
    redis.disconnect();
    return val === "1";
  } catch {
    return false;
  }
}

export default async function GuildPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { guildId } = await params;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  const config = await getGuildConfig(guildId);
  const lockdown = guild?.lockdown ?? (await getLockdown(guildId));

  const logChannels = await prisma.guildLogChannel.findMany({
    where: { guildId },
    orderBy: { logType: "asc" },
  });

  const [events, snapshots, whitelist] = await Promise.all([
    prisma.securityEvent.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.snapshot.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, label: true, createdAt: true, sizeBytes: true },
    }),
    prisma.whitelistEntry.findMany({ where: { guildId } }),
  ]);

  if (!guild) {
    await prisma.guild.create({
      data: { id: guildId, config: config as object },
    });
  }

  return (
    <>
      <Nav />
      <main className="container">
        <GuildDashboard
          guildId={guildId}
          config={config}
          lockdown={lockdown}
          events={events.map((e) => ({
            id: e.id,
            type: e.type,
            severity: e.severity,
            actorId: e.actorId,
            createdAt: e.createdAt.toISOString(),
            metadata: e.metadata,
          }))}
          snapshots={snapshots.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
          }))}
          whitelist={whitelist}
          logChannels={logChannels.map((l) => ({
            logType: l.logType,
            channelId: l.channelId,
          }))}
        />
      </main>
    </>
  );
}
