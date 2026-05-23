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
  ai: z.boolean().default(true),
  brain: z.boolean().default(true),
});

export type GuildFeatures = z.infer<typeof guildFeaturesSchema>;

export function defaultGuildFeatures(): GuildFeatures {
  return guildFeaturesSchema.parse({});
}
