import { AnalyticsPanel } from "@/components/panels/AnalyticsPanel";
import { requireGuildAccess } from "@/lib/guild-page";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);
  return <AnalyticsPanel guildId={guildId} />;
}
