"use client";

import { useState } from "react";
import type { GuildConfig } from "@sentinel/shared";
import { patchGuildConfig } from "@/lib/config-client";

export function useGuildConfig(guildId: string, initial: GuildConfig) {
  const [config, setConfig] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(patch: Partial<GuildConfig>): Promise<boolean> {
    setSaving(true);
    setMessage("");
    const result = await patchGuildConfig(guildId, patch);
    setSaving(false);
    if (!result.ok || !result.config) {
      setMessage(result.error ?? "Erreur lors de la sauvegarde.");
      return false;
    }
    setConfig(result.config);
    setMessage("Configuration sauvegardée.");
    return true;
  }

  return { config, setConfig, saving, message, setMessage, save };
}
