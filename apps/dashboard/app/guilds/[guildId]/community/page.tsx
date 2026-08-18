import { prisma } from "@sentinel/database";
import { CommunityPanel } from "@/components/panels/CommunityPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config } = await loadGuildConfigPage(guildId);
  const [polls, giveaways] = await Promise.all([
    prisma.poll.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, question: true, channelId: true, endsAt: true, ended: true },
    }),
    prisma.giveaway.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, prize: true, winners: true, channelId: true, endsAt: true, ended: true },
    }),
  ]);
  return (
    <CommunityPanel
      guildId={guildId}
      initialConfig={config}
      polls={polls.map((row) => ({ ...row, endsAt: row.endsAt?.toISOString() ?? null }))}
      giveaways={giveaways.map((row) => ({ ...row, endsAt: row.endsAt.toISOString() }))}
    />
  );
}
