import { prisma } from "@sentinel/database";
import { LogsPanel } from "@/components/panels/LogsPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function LogsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config } = await loadGuildConfigPage(guildId);
  const [logChannels, events] = await Promise.all([
    prisma.guildLogChannel.findMany({ where: { guildId }, orderBy: { logType: "asc" } }),
    prisma.securityEvent.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, type: true, severity: true, actorId: true, createdAt: true },
    }),
  ]);
  return (
    <LogsPanel
      guildId={guildId}
      initialConfig={config}
      logChannels={logChannels.map((row) => ({ logType: row.logType, channelId: row.channelId }))}
      events={events.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    />
  );
}
