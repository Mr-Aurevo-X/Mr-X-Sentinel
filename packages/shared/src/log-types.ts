export const LOG_TYPES = [
  "join_leave",
  "message",
  "moderation",
  "tickets",
  "automod",
  "security",
  "economy",
  "levels",
  "music",
  "admin",
] as const;

export type LogType = (typeof LOG_TYPES)[number];

export const ACTIVE_LOG_TYPES = LOG_TYPES;

export type ActiveLogType = LogType;

export const LOG_CHANNEL_NAMES: Record<LogType, string> = {
  join_leave: "logs-join-leave",
  message: "logs-message",
  moderation: "logs-moderation",
  tickets: "logs-tickets",
  automod: "logs-automod",
  security: "logs-security",
  economy: "logs-economy",
  levels: "logs-levels",
  music: "logs-music",
  admin: "logs-admin",
};

export const LOG_CATEGORY_NAME = "Logs Sentinel";
export const LOG_ROLE_NAME = "Logs";
