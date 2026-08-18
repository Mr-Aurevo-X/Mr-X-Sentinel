"use client";

import {
  CATEGORY_CHANNEL_TYPE,
  TEXT_CHANNEL_TYPES,
  VOICE_CHANNEL_TYPES,
  type DiscordResources,
} from "@/lib/discord-resources";

export function ChannelSelect({
  resources,
  value,
  onChange,
  kinds = "text",
  allowEmpty = true,
}: {
  resources: DiscordResources;
  value: string | null;
  onChange: (id: string | null) => void;
  kinds?: "text" | "voice" | "category" | "all";
  allowEmpty?: boolean;
}) {
  if (!resources.available) {
    return (
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.trim() || null)}
        placeholder="ID salon"
      />
    );
  }

  const channels = resources.channels.filter((channel) => {
    if (kinds === "all") return true;
    if (kinds === "text") return TEXT_CHANNEL_TYPES.has(channel.type);
    if (kinds === "voice") return VOICE_CHANNEL_TYPES.has(channel.type);
    return channel.type === CATEGORY_CHANNEL_TYPE;
  });

  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      {allowEmpty ? <option value="">—</option> : null}
      {channels.map((channel) => (
        <option key={channel.id} value={channel.id}>
          {kinds === "category" ? channel.name : `#${channel.name}`}
        </option>
      ))}
    </select>
  );
}
