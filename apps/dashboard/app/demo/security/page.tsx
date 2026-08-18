import { SecurityPanel } from "@/components/panels/SecurityPanel";
import { DEMO_CASES, DEMO_CONFIG, DEMO_GUILD_ID, DEMO_WHITELIST } from "@/lib/demo-guild";

export default function DemoSecurityPage() {
  return (
    <SecurityPanel
      guildId={DEMO_GUILD_ID}
      initialConfig={DEMO_CONFIG}
      whitelist={DEMO_WHITELIST}
      cases={DEMO_CASES}
    />
  );
}
