import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { customId } from "@sentinel/shared";

export function buildHelpTierRows(): ActionRowBuilder<StringSelectMenuBuilder>[] {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId("help", "tier"))
        .setPlaceholder("Choisir une catégorie d'aide")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Public").setValue("public").setDescription("Commandes membres"),
          new StringSelectMenuOptionBuilder().setLabel("Staff").setValue("staff").setDescription("Modération & tickets"),
          new StringSelectMenuOptionBuilder().setLabel("Owner serveur").setValue("owner").setDescription("Config & niveaux"),
          new StringSelectMenuOptionBuilder().setLabel("Bot owner").setValue("bot_owner").setDescription("Commandes globales"),
        ),
    ),
  ];
}
