import { prisma } from "@sentinel/database";
import { LevelsPanel } from "@/components/panels/LevelsPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function LevelsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config } = await loadGuildConfigPage(guildId);
  const top = await prisma.userXp.findMany({
    where: { guildId },
    orderBy: { xp: "desc" },
    take: 15,
    select: { userId: true, xp: true, level: true },
  });
  return <LevelsPanel guildId={guildId} initialConfig={config} top={top} />;
}
