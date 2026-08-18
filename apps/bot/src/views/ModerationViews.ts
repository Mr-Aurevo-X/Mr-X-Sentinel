import { ActionRowBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder } from "discord.js";
import { customId } from "@sentinel/shared";

export function buildModPanelUserSelect(action: string): ActionRowBuilder<UserSelectMenuBuilder>[] {
  return [
    new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(customId("modpanel", "select", action))
        .setPlaceholder("Choisir un membre")
        .setMinValues(1)
        .setMaxValues(1),
    ),
  ];
}

export function buildModerationConfirmRows(action: string, targetId: string): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("mod", "confirm", `${action}:${targetId}`))
        .setLabel("Confirmer")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(customId("mod", "cancel"))
        .setLabel("Annuler")
        .setEmoji("❎")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export function buildModerationPanelRows(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId("modpanel", "warn")).setLabel("Warn").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("modpanel", "mute")).setLabel("Mute 10m").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("modpanel", "kick")).setLabel("Kick").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(customId("modpanel", "ban")).setLabel("Ban").setStyle(ButtonStyle.Danger),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId("modpanel", "clear")).setLabel("Clear info").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(customId("modpanel", "nuke")).setLabel("Nuke salon").setStyle(ButtonStyle.Danger),
    ),
  ];
}
