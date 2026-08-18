import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { customId } from "@sentinel/shared";

export function buildBlackjackRows(sessionId: string): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("bj", "hit", sessionId))
        .setLabel("Hit")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customId("bj", "stand", sessionId))
        .setLabel("Stand")
        .setEmoji("✋")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(customId("bj", "double", sessionId))
        .setLabel("Double")
        .setEmoji("✖️2")
        .setStyle(ButtonStyle.Success),
    ),
  ];
}
