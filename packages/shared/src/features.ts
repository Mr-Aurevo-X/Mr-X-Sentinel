import { z } from "zod";

export const guildFeaturesSchema = z.object({
  security: z.boolean().default(true),
  snapshots: z.boolean().default(true),
  automod: z.boolean().default(true),
  moderation: z.boolean().default(true),
  economy: z.boolean().default(true),
  levels: z.boolean().default(true),
  fun: z.boolean().default(true),
  tickets: z.boolean().default(true),
  templates: z.boolean().default(true),
  community: z.boolean().default(true),
  music: z.boolean().default(true),
  ai: z.boolean().default(false),
  brain: z.boolean().default(false),
});

export type GuildFeatures = z.infer<typeof guildFeaturesSchema>;

/** Parked modules live in archive/ai-brain. Kept in JSON for existing guilds. */
export const PARKED_FEATURE_KEYS = ["ai", "brain"] as const;
export type ParkedFeatureKey = (typeof PARKED_FEATURE_KEYS)[number];

const parkedKeySet = new Set<string>(PARKED_FEATURE_KEYS);

export function isParkedFeatureKey(key: string): key is ParkedFeatureKey {
  return parkedKeySet.has(key);
}

export function defaultGuildFeatures(): GuildFeatures {
  return guildFeaturesSchema.parse({});
}

export function visibleGuildFeatures(features: GuildFeatures): Array<[string, boolean]> {
  return Object.entries(features).filter(([key]) => !parkedKeySet.has(key));
}

export function stripParkedFeaturePatch(
  features: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!features) return undefined;
  const next = { ...features };
  for (const key of PARKED_FEATURE_KEYS) delete next[key];
  return next;
}
