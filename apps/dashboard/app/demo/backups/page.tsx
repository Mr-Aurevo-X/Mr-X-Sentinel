import { BackupsPanel } from "@/components/panels/BackupsPanel";
import { DEMO_GUILD_ID, DEMO_SNAPSHOTS } from "@/lib/demo-guild";

export default function DemoBackupsPage() {
  return <BackupsPanel guildId={DEMO_GUILD_ID} snapshots={DEMO_SNAPSHOTS} />;
}
