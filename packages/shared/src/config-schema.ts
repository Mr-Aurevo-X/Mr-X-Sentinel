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
});

export const verificationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  channelId: z.string().nullable().default(null),
  verifiedRoleId: z.string().nullable().default(null),
  unverifiedRoleId: z.string().nullable().default(null),
  useTurnstile: z.boolean().default(false),
});

export const guildConfigSchema = z.object({
  locale: z.enum(["fr", "en"]).default("fr"),
  modLogChannelId: z.string().nullable().default(null),
  alertWebhookUrl: z.string().url().nullable().default(null),
  quarantineRoleId: z.string().nullable().default(null),
  features: guildFeaturesSchema.default(defaultGuildFeatures()),
  antiNuke: antiNukeConfigSchema,
  antiRaid: antiRaidConfigSchema,
  automod: automodConfigSchema,
  verification: verificationConfigSchema,
});

export type GuildConfig = z.infer<typeof guildConfigSchema>;

export function parseGuildConfig(raw: unknown): GuildConfig {
  return guildConfigSchema.parse(raw);
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
