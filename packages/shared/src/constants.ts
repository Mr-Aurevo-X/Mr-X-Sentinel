export const BRAND_NAME = "mr-x-sentinel";
export const BRAND_COLOR = 0x5865f2;

export const REDIS_KEYS = {
  configChannel: (guildId: string) => `mrx:config:${guildId}`,
  joinWindow: (guildId: string) => `mrx:raid:join:${guildId}`,
  msgWindow: (guildId: string, userId: string) => `mrx:spam:msg:${guildId}:${userId}`,
  threatScore: (guildId: string, userId: string) => `mrx:threat:${guildId}:${userId}`,
  lockdown: (guildId: string) => `mrx:lockdown:${guildId}`,
  robCooldown: (guildId: string, thiefId: string, victimId: string) =>
    `mrx:rob:${guildId}:${thiefId}:${victimId}`,
} as const;

export const DEFAULT_ANTI_NUKE = {
  enabled: true,
  monitorOnly: false,
  instantActions: [
    "CHANNEL_DELETE",
    "ROLE_DELETE",
    "GUILD_UPDATE",
    "WEBHOOK_CREATE",
    "BOT_ADD",
  ] as const,
  thresholds: {
    BAN: { count: 3, windowSec: 10 },
    KICK: { count: 5, windowSec: 10 },
    CHANNEL_CREATE: { count: 5, windowSec: 15 },
    ROLE_CREATE: { count: 5, windowSec: 15 },
    ROLE_UPDATE: { count: 5, windowSec: 15 },
    CHANNEL_UPDATE: { count: 8, windowSec: 15 },
  },
  quarantineDays: 7,
  autoLockdown: true,
};

export const DEFAULT_ANTI_RAID = {
  enabled: true,
  joinLimit: 10,
  joinWindowSec: 10,
  minAccountAgeDays: 3,
  requireAvatar: false,
  suspiciousNamePatterns: ["discord.gg", "nitro", "free", "raid"],
  autoLockdown: true,
};

export const DEFAULT_AUTOMOD = {
  enabled: true,
  maxMentions: 5,
  maxDuplicateMessages: 3,
  duplicateWindowSec: 8,
  maxMessagesPerSec: 4,
  blockInvites: true,
  allowedInviteGuilds: [] as string[],
  wordBlacklist: [] as string[],
  blockEveryone: true,
  newAccountHours: 24,
  blockCaps: true,
  capsRatioLimit: 0.7,
  blockZalgo: true,
  blockExternalUrls: false,
  blockedUrls: [] as string[],
};

export const DANGEROUS_PERMISSIONS = [
  "Administrator",
  "ManageGuild",
  "ManageRoles",
  "ManageChannels",
  "BanMembers",
  "KickMembers",
  "ManageWebhooks",
  "MentionEveryone",
] as const;
