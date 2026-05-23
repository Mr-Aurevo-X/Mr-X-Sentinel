import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { customId } from "@sentinel/shared";

export function buildAutomodPanelRows(enabled: boolean): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("automod", "toggle"))
        .setLabel(enabled ? "Désactiver automod" : "Activer automod")
        .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(customId("automod", "caps"))
        .setLabel("Toggle caps")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(customId("automod", "zalgo"))
        .setLabel("Toggle zalgo")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(customId("automod", "urls"))
        .setLabel("Toggle URLs ext.")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}
