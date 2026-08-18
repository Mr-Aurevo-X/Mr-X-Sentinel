import { OverviewPanel } from "@/components/panels/OverviewPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function GuildOverviewPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config, lockdown } = await loadGuildConfigPage(guildId);
  return <OverviewPanel guildId={guildId} initialConfig={config} lockdown={lockdown} />;
}
