import { prisma } from "@sentinel/database";
import { TicketsPanel } from "@/components/panels/TicketsPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config } = await loadGuildConfigPage(guildId);
  const tickets = await prisma.ticketChannel.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      channelId: true,
      ownerId: true,
      claimedBy: true,
      status: true,
      ticketType: true,
    },
  });
  return <TicketsPanel guildId={guildId} initialConfig={config} tickets={tickets} />;
}
