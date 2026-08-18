import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { ACTIVE_LOG_TYPES, customId } from "@sentinel/shared";
import { logProvisioningService } from "@sentinel/core";
import { successEmbed } from "../ui/embeds.js";
import type { ComponentHandler } from "./types.js";

export function buildLogsPanel(): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("sentinel:logs:types")
        .setPlaceholder("Types de logs configurés")
        .addOptions(
          ACTIVE_LOG_TYPES.map((t) => ({
            label: t,
            value: t,
            description: `Salon logs-${t.replace("_", "-")}`,
          })),
        )
        .setDisabled(true),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("logs", "create"))
        .setLabel("Créer tous les salons logs")
        .setStyle(ButtonStyle.Success),
    ),
  ];
}

export const handleLogsComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  if (parsed.action !== "create") return;
  await interaction.deferReply({ ephemeral: true });
  const channels = await logProvisioningService.provisionAll(guild);
  await interaction.editReply({
    embeds: [successEmbed("Logs", `${Object.keys(channels).length} salons créés.`)],
  });
};
