import { EconomyPanel } from "@/components/panels/EconomyPanel";
import { DEMO_CONFIG, DEMO_GUILD_ID, DEMO_SHOP } from "@/lib/demo-guild";

export default function DemoEconomyPage() {
  return <EconomyPanel guildId={DEMO_GUILD_ID} initialConfig={DEMO_CONFIG} shop={DEMO_SHOP} />;
}
