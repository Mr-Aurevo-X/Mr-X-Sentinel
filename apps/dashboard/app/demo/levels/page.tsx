import { LevelsPanel } from "@/components/panels/LevelsPanel";
import { DEMO_CONFIG, DEMO_GUILD_ID, DEMO_LEVELS } from "@/lib/demo-guild";

export default function DemoLevelsPage() {
  return <LevelsPanel guildId={DEMO_GUILD_ID} initialConfig={DEMO_CONFIG} top={DEMO_LEVELS} />;
}
