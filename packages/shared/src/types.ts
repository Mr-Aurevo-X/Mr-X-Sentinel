export type WhitelistLevel = "EXTRA_OWNER" | "TRUSTED";

export type SecurityAction =
  | "LOG"
  | "STRIP_ROLES"
  | "TIMEOUT"
  | "BAN"
  | "LOCKDOWN"
  | "ROLLBACK"
  | "QUARANTINE";

export type SecuritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ModCaseType =
  | "WARN"
  | "MUTE"
  | "KICK"
  | "BAN"
  | "SOFTBAN"
  | "UNBAN"
  | "NOTE";

export type AuditActionType =
  | "BAN"
  | "KICK"
  | "CHANNEL_DELETE"
  | "CHANNEL_CREATE"
  | "CHANNEL_UPDATE"
  | "ROLE_DELETE"
  | "ROLE_CREATE"
  | "ROLE_UPDATE"
  | "GUILD_UPDATE"
  | "WEBHOOK_CREATE"
  | "WEBHOOK_DELETE"
  | "BOT_ADD"
  | "MEMBER_ROLE_UPDATE"
  | "EMOJI_DELETE"
  | "UNKNOWN";

export interface ThreatDecision {
  actions: SecurityAction[];
  severity: SecuritySeverity;
  reason: string;
  shouldRollback: boolean;
}

export interface SnapshotPayload {
  version: 1;
  guildId: string;
  guildName: string;
  createdAt: string;
  roles: SnapshotRole[];
  channels: SnapshotChannel[];
  emojis: SnapshotEmoji[];
}

export interface SnapshotRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  mentionable: boolean;
  managed: boolean;
}

export interface SnapshotChannel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
  topic: string | null;
  nsfw: boolean;
  rateLimitPerUser: number;
  permissionOverwrites: {
    id: string;
    type: number;
    allow: string;
    deny: string;
  }[];
}

export interface SnapshotEmoji {
  id: string;
  name: string;
  animated: boolean;
}
