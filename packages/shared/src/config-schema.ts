import { z } from "zod";
import {
  DEFAULT_ANTI_NUKE,
  DEFAULT_ANTI_RAID,
  DEFAULT_AUTOMOD,
} from "./constants.js";
import { defaultGuildFeatures, guildFeaturesSchema } from "./features.js";

const thresholdSchema = z.object({
  count: z.number().int().min(1).max(100),
  windowSec: z.number().int().min(1).max(300),
});

export const antiNukeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  monitorOnly: z.boolean().default(false),
  instantActions: z.array(z.string()).default([]),
  thresholds: z.record(z.string(), thresholdSchema).default({}),
  quarantineDays: z.number().int().min(1).max(28).default(7),
  autoLockdown: z.boolean().default(true),
});

export const antiRaidConfigSchema = z.object({
  enabled: z.boolean().default(true),
  joinLimit: z.number().int().min(1).max(100).default(10),
  joinWindowSec: z.number().int().min(1).max(120).default(10),
  minAccountAgeDays: z.number().int().min(0).max(365).default(3),
  requireAvatar: z.boolean().default(false),
  suspiciousNamePatterns: z.array(z.string()).default([]),
  autoLockdown: z.boolean().default(true),
});

export const automodConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxMentions: z.number().int().min(0).max(50).default(5),
  maxDuplicateMessages: z.number().int().min(2).max(20).default(3),
  duplicateWindowSec: z.number().int().min(1).max(60).default(8),
  maxMessagesPerSec: z.number().int().min(1).max(20).default(4),
  blockInvites: z.boolean().default(true),
  allowedInviteGuilds: z.array(z.string()).default([]),
  wordBlacklist: z.array(z.string()).default([]),
  blockEveryone: z.boolean().default(true),
  newAccountHours: z.number().int().min(0).max(168).default(24),
  blockCaps: z.boolean().default(true),
  capsRatioLimit: z.number().min(0.5).max(1).default(0.7),
  blockZalgo: z.boolean().default(true),
  blockExternalUrls: z.boolean().default(false),
  blockedUrls: z.array(z.string()).default([]),
});

export const ticketConfigSchema = z.object({
  panelChannelId: z.string().nullable().default(null),
  categoryId: z.string().nullable().default(null),
  supportRoleIds: z.array(z.string()).default([]),
});

export const verificationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  channelId: z.string().nullable().default(null),
  verifiedRoleId: z.string().nullable().default(null),
  unverifiedRoleId: z.string().nullable().default(null),
  useTurnstile: z.boolean().default(false),
});

export const levelsConfigSchema = z.object({
  levelUpChannelId: z.string().nullable().default(null),
  rewardRolesEnabled: z.boolean().default(true),
  referenceRoleId: z.string().nullable().default(null),
  botRoleId: z.string().nullable().default(null),
});

export const economyConfigSchema = z.object({
  dailyMin: z.number().int().min(0).default(100),
  dailyMax: z.number().int().min(0).default(500),
  workMin: z.number().int().min(0).default(80),
  workMax: z.number().int().min(0).default(350),
  crimeMin: z.number().int().min(0).default(50),
  crimeMax: z.number().int().min(0).default(500),
});

export const welcomeConfigSchema = z.object({
  welcomeChannelId: z.string().nullable().default(null),
  goodbyeChannelId: z.string().nullable().default(null),
  autoRoleId: z.string().nullable().default(null),
});

export const staffConfigSchema = z.object({
  modRoleIds: z.array(z.string()).default([]),
});

export const channelsConfigSchema = z.object({
  spamChannelId: z.string().nullable().default(null),
  counterChannelId: z.string().nullable().default(null),
  counterTemplate: z.string().default("Membres: {count}"),
});

export const starboardConfigSchema = z.object({
  enabled: z.boolean().default(false),
  channelId: z.string().nullable().default(null),
  threshold: z.number().int().min(1).default(3),
});

export const birthdayConfigSchema = z.object({
  channelId: z.string().nullable().default(null),
  entries: z.record(z.string(), z.string()).default({}),
});

export const tempVoiceConfigSchema = z.object({
  hubChannelId: z.string().nullable().default(null),
});

export const countingConfigSchema = z.object({
  channelId: z.string().nullable().default(null),
  nextNumber: z.number().int().min(1).default(1),
  lastUserId: z.string().nullable().default(null),
  highScore: z.number().int().min(0).default(0),
});

export const aiConfigSchema = z.object({
  contextMode: z.enum(["user", "channel", "thread"]).default("user"),
  mentionEnabled: z.boolean().default(true),
});

export const guildConfigSchema = z.object({
  locale: z.enum(["fr", "en"]).default("fr"),
  modLogChannelId: z.string().nullable().default(null),
  alertWebhookUrl: z.string().url().nullable().default(null),
  quarantineRoleId: z.string().nullable().default(null),
  features: guildFeaturesSchema.default(defaultGuildFeatures()),
  tickets: ticketConfigSchema.default({}),
  antiNuke: antiNukeConfigSchema,
  antiRaid: antiRaidConfigSchema,
  automod: automodConfigSchema,
  verification: verificationConfigSchema,
  levels: levelsConfigSchema.default({}),
  economy: economyConfigSchema.default({}),
  welcome: welcomeConfigSchema.default({}),
  staff: staffConfigSchema.default({}),
  channels: channelsConfigSchema.default({}),
  starboard: starboardConfigSchema.default({}),
  birthday: birthdayConfigSchema.default({}),
  tempVoice: tempVoiceConfigSchema.default({}),
  counting: countingConfigSchema.default({}),
  ai: aiConfigSchema.default({}),
});

export type GuildConfig = z.infer<typeof guildConfigSchema>;

export function parseGuildConfig(raw: unknown): GuildConfig {
  const base = defaultGuildConfig();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  return guildConfigSchema.parse({
    ...base,
    ...r,
    features: {
      ...base.features,
      ...(typeof r.features === "object" && r.features ? r.features : {}),
    },
    tickets: { ...base.tickets, ...(typeof r.tickets === "object" && r.tickets ? r.tickets : {}) },
    levels: { ...base.levels, ...(typeof r.levels === "object" && r.levels ? r.levels : {}) },
    economy: { ...base.economy, ...(typeof r.economy === "object" && r.economy ? r.economy : {}) },
    welcome: { ...base.welcome, ...(typeof r.welcome === "object" && r.welcome ? r.welcome : {}) },
    staff: { ...base.staff, ...(typeof r.staff === "object" && r.staff ? r.staff : {}) },
    channels: { ...base.channels, ...(typeof r.channels === "object" && r.channels ? r.channels : {}) },
    starboard: { ...base.starboard, ...(typeof r.starboard === "object" && r.starboard ? r.starboard : {}) },
    birthday: { ...base.birthday, ...(typeof r.birthday === "object" && r.birthday ? r.birthday : {}) },
    tempVoice: { ...base.tempVoice, ...(typeof r.tempVoice === "object" && r.tempVoice ? r.tempVoice : {}) },
    counting: { ...base.counting, ...(typeof r.counting === "object" && r.counting ? r.counting : {}) },
    ai: { ...base.ai, ...(typeof r.ai === "object" && r.ai ? r.ai : {}) },
  });
}

export function defaultGuildConfig(): GuildConfig {
  return guildConfigSchema.parse({
    locale: "fr",
    antiNuke: DEFAULT_ANTI_NUKE,
    antiRaid: DEFAULT_ANTI_RAID,
    automod: DEFAULT_AUTOMOD,
    verification: {},
  });
}
