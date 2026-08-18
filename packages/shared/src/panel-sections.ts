export const PANEL_SECTIONS = [
  "overview",
  "security",
  "automod",
  "community",
  "economy",
  "levels",
  "tickets",
  "logs",
  "backups",
] as const;

export type PanelSection = (typeof PANEL_SECTIONS)[number];

/** Top-level GuildConfig keys each panel may persist. */
export const PANEL_SECTION_CONFIG_KEYS: Record<PanelSection, readonly string[]> = {
  overview: ["features", "locale"],
  security: ["antiNuke", "antiRaid", "quarantineRoleId", "staff"],
  automod: ["automod"],
  community: ["welcome", "verification", "starboard", "tempVoice", "counting", "birthday", "channels"],
  economy: ["economy"],
  levels: ["levels"],
  tickets: ["tickets"],
  logs: ["modLogChannelId", "alertWebhookUrl"],
  backups: [],
};
