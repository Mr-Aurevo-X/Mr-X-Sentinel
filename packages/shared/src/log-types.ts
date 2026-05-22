export const LOG_TYPES = [
  "join_leave",
  "message",
  "moderation",
  "tickets",
  "automod",
  "security",
  "brain",
  "economy",
  "levels",
  "music",
  "ai",
  "admin",
] as const;

export type LogType = (typeof LOG_TYPES)[number];

export const LOG_CHANNEL_NAMES: Record<LogType, string> = {
  join_leave: "logs-join-leave",
  message: "logs-message",
  moderation: "logs-moderation",
  tickets: "logs-tickets",
  automod: "logs-automod",
  security: "logs-security",
  brain: "logs-brain",
  economy: "logs-economy",
  levels: "logs-levels",
  music: "logs-music",
  ai: "logs-ai",
  admin: "logs-admin",
};

export const LOG_CATEGORY_NAME = "Logs Sentinel";
export const LOG_ROLE_NAME = "Logs";
