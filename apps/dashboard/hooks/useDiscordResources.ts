"use client";

import { useEffect, useState } from "react";
import type { DiscordResources } from "@/lib/discord-resources";

const empty: DiscordResources = { channels: [], roles: [], available: false };

export function useDiscordResources(guildId: string): DiscordResources {
  const [data, setData] = useState<DiscordResources>(empty);

  useEffect(() => {
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
  }, [guildId]);

  return data;
}
