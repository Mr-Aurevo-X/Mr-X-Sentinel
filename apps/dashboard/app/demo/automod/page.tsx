import { AutomodPanel } from "@/components/panels/AutomodPanel";
import { DEMO_CONFIG, DEMO_GUILD_ID } from "@/lib/demo-guild";

export default function DemoAutomodPage() {
  return <AutomodPanel guildId={DEMO_GUILD_ID} initialConfig={DEMO_CONFIG} />;
}
