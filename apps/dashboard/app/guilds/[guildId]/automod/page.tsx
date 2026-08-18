import { AutomodPanel } from "@/components/panels/AutomodPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function AutomodPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config } = await loadGuildConfigPage(guildId);
  return <AutomodPanel guildId={guildId} initialConfig={config} />;
}
