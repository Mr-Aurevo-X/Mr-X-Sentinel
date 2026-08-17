import type { GuildConfig, GuildFeatures } from "@sentinel/shared";
import { getGuildConfig } from "@sentinel/database";

export async function loadGuildContext(guildId: string): Promise<{
  config: GuildConfig;
  features: GuildFeatures;
}> {
  const config = await getGuildConfig(guildId);
  return { config, features: config.features };
}

export async function getGuildFeatures(guildId: string): Promise<GuildFeatures> {
  const { features } = await loadGuildContext(guildId);
  return features;
}

export function isModuleEnabled(features: GuildFeatures, module: keyof GuildFeatures): boolean {
  return features[module] === true;
}
