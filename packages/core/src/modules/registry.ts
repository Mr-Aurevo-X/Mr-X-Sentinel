import type { GuildFeatures } from "@sentinel/shared";
import { getGuildConfig } from "@sentinel/database";

export async function getGuildFeatures(guildId: string): Promise<GuildFeatures> {
  const config = await getGuildConfig(guildId);
  return config.features;
}

export function isModuleEnabled(features: GuildFeatures, module: keyof GuildFeatures): boolean {
  return features[module] === true;
}
