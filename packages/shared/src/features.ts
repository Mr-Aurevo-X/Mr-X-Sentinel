import { z } from "zod";

export const guildFeaturesSchema = z.object({
  security: z.boolean().default(true),
  snapshots: z.boolean().default(true),
  automod: z.boolean().default(true),
  moderation: z.boolean().default(true),
  economy: z.boolean().default(false),
  levels: z.boolean().default(false),
  fun: z.boolean().default(false),
  tickets: z.boolean().default(false),
  templates: z.boolean().default(true),
  community: z.boolean().default(false),
  music: z.boolean().default(false),
});

export type GuildFeatures = z.infer<typeof guildFeaturesSchema>;

export function defaultGuildFeatures(): GuildFeatures {
  return guildFeaturesSchema.parse({});
}

export function visibleGuildFeatures(features: GuildFeatures): Array<[string, boolean]> {
  return Object.entries(features);
}

export function isGuildFeatureKey(key: string): key is keyof GuildFeatures {
  return key in defaultGuildFeatures();
}
