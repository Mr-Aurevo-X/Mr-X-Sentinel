import { TicketsPanel } from "@/components/panels/TicketsPanel";
import { DEMO_CONFIG, DEMO_GUILD_ID, DEMO_TICKETS } from "@/lib/demo-guild";

export default function DemoTicketsPage() {
  return <TicketsPanel guildId={DEMO_GUILD_ID} initialConfig={DEMO_CONFIG} tickets={DEMO_TICKETS} />;
}
