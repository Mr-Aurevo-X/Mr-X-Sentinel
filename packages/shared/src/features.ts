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
