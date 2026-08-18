import { prisma } from "@sentinel/database";
import { EconomyPanel } from "@/components/panels/EconomyPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function EconomyPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config } = await loadGuildConfigPage(guildId);
  const shop = await prisma.shopItem.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
  });
  return <EconomyPanel guildId={guildId} initialConfig={config} shop={shop} />;
}
