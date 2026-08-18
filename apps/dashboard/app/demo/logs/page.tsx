import { LogsPanel } from "@/components/panels/LogsPanel";
import { DEMO_CONFIG, DEMO_EVENTS, DEMO_GUILD_ID, DEMO_LOG_CHANNELS } from "@/lib/demo-guild";

export default function DemoLogsPage() {
  return (
    <LogsPanel
      guildId={DEMO_GUILD_ID}
      initialConfig={DEMO_CONFIG}
      logChannels={DEMO_LOG_CHANNELS}
      events={DEMO_EVENTS}
    />
  );
}
