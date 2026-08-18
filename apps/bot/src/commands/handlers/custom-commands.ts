import type { ChatInputCommandInteraction } from "discord.js";
import { customCommandService } from "@sentinel/core";
import { CUSTOM_COMMAND_MAX_PER_GUILD } from "@sentinel/shared";
import { buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleAddCommand(
  interaction: ChatInputCommandInteraction,
  reservedNames: string[],
): Promise<CommandReply> {
  const guild = interaction.guild!;
  const name = interaction.options.getString("name", true);
  const texte = interaction.options.getString("texte", true);
  const description = interaction.options.getString("description");
  const { row, created } = await customCommandService.add(
    guild,
    interaction.user.id,
    name,
    texte,
    description,
    reservedNames,
  );
  const verb = created ? "créée" : "mise à jour";
  return {
    embeds: [
      successEmbed(
        "Commande perso",
        `\`/${row.name}\` ${verb}. Tout le monde peut l'utiliser.`,
      ),
    ],
  };
}

export async function handleRemoveCommand(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  const name = interaction.options.getString("name", true);
  await customCommandService.remove(interaction.guild!, name);
  return {
    embeds: [successEmbed("Commande perso", `\`/${name.trim().toLowerCase()}\` supprimée.`)],
  };
}

export async function handleListCommands(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  const rows = await customCommandService.list(interaction.guild!.id);
  if (rows.length === 0) {
    return { embeds: [buildSimpleEmbed("Commandes perso", "Aucune commande personnalisée.")] };
  }
  const lines = rows.map((r) => `\`/${r.name}\` — ${r.description}`).join("\n");
  return {
    embeds: [
      buildSimpleEmbed(`Commandes perso (${rows.length}/${CUSTOM_COMMAND_MAX_PER_GUILD})`, lines),
    ],
  };
}
