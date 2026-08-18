import { OverviewPanel } from "@/components/panels/OverviewPanel";
import { DEMO_CONFIG, DEMO_GUILD_ID } from "@/lib/demo-guild";

export default function DemoOverviewPage() {
  return <OverviewPanel guildId={DEMO_GUILD_ID} initialConfig={DEMO_CONFIG} lockdown={false} />;
}
