import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ActionRowBuilder as AR,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { customId } from "@sentinel/shared";
import { listTemplates } from "@sentinel/core";

export function buildTemplatePanelRows(): AR<MessageActionRowComponentBuilder>[] {
  return [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("template", "list"))
        .setLabel("Voir templates")
        .setEmoji("📚")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customId("template", "apply_menu"))
        .setLabel("Appliquer")
        .setEmoji("🧩")
        .setStyle(ButtonStyle.Success),
    ),
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("template", "reset_warn"))
        .setLabel("Reset complet")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger),
    ),
  ];
}

export function buildTemplateApplySelect(): AR<MessageActionRowComponentBuilder> {
  const templates = listTemplates();
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId("template", "apply"))
      .setPlaceholder("Choisir un template…")
      .addOptions(
        templates.slice(0, 25).map((t) => ({
          label: t.label.slice(0, 100),
          description: t.description.slice(0, 100),
          value: t.key,
        })),
      ),
  );
}

export function buildTemplateResetConfirmRows(): AR<MessageActionRowComponentBuilder>[] {
  return [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("template", "reset_confirm"))
        .setLabel("Confirmer le reset")
        .setEmoji("⚠️")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(customId("template", "reset_cancel"))
        .setLabel("Annuler")
        .setEmoji("❎")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}
