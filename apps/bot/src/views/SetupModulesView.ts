import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { customId, SETUP_TOGGLE_FEATURES, type GuildFeatures, type SetupToggleFeature } from "@sentinel/shared";

const LABELS: Record<SetupToggleFeature, string> = {
  economy: "Économie",
  levels: "XP",
  tickets: "Tickets",
  fun: "Fun",
  music: "Musique",
  community: "Communauté",
};

export function buildSetupModuleRows(features: GuildFeatures): ActionRowBuilder<ButtonBuilder>[] {
  const buttons = SETUP_TOGGLE_FEATURES.map((key) =>
    new ButtonBuilder()
      .setCustomId(customId("setupfeat", "toggle", key))
      .setLabel(`${features[key] ? "On" : "Off"} · ${LABELS[key]}`)
      .setStyle(features[key] ? ButtonStyle.Success : ButtonStyle.Secondary),
  );
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons.slice(0, 3)),
    new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons.slice(3)),
  ];
}
