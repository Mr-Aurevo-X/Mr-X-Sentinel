import { CommunityPanel } from "@/components/panels/CommunityPanel";
import { DEMO_CONFIG, DEMO_GIVEAWAYS, DEMO_GUILD_ID, DEMO_POLLS } from "@/lib/demo-guild";

export default function DemoCommunityPage() {
  return (
    <CommunityPanel
      guildId={DEMO_GUILD_ID}
      initialConfig={DEMO_CONFIG}
      polls={DEMO_POLLS}
      giveaways={DEMO_GIVEAWAYS}
    />
  );
}
