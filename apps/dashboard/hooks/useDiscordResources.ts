"use client";

import { useEffect, useState } from "react";
import type { DiscordResources } from "@/lib/discord-resources";
import { useDemoPreview } from "@/components/DemoPreview";
import { DEMO_RESOURCES } from "@/lib/demo-guild";

const empty: DiscordResources = { channels: [], roles: [], available: false };

export function useDiscordResources(guildId: string): DiscordResources {
  const preview = useDemoPreview();
  const [data, setData] = useState<DiscordResources>(preview ? DEMO_RESOURCES : empty);

  useEffect(() => {
    if (preview) {
      setData(DEMO_RESOURCES);
      return;
    }
    let cancelled = false;
    void fetch(`/api/guilds/${guildId}/discord`)
      .then((res) => (res.ok ? res.json() : empty))
      .then((payload: DiscordResources) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setData(empty);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId, preview]);

  return data;
}
