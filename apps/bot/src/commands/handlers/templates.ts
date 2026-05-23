import type { ChatInputCommandInteraction } from "discord.js";
import { listTemplates, templateService } from "@sentinel/core";
import { buildSimpleEmbed, successEmbed, warningEmbed } from "../../ui/embeds.js";
import { buildTemplatePanelRows } from "../../views/TemplatePanelView.js";
import type { CommandReply } from "../middleware.js";

export async function handleTemplatePanel(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const count = listTemplates().length;
  return {
    embeds: [
      buildSimpleEmbed(
        "🧩 Panneau templates",
        `**${count}** modèles disponibles.\n\n• **Appliquer** — crée rôles, catégories et salons\n• **Reset complet** — repartir de zéro (destructif)`,
        0x5865f2,
      ),
    ],
    components: buildTemplatePanelRows(),
  };
}

export async function handleTemplateApply(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
  templateKey: string,
): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const template = await templateService.apply(
    interaction.guild!,
    templateKey,
    client,
    interaction.user.id,
    { createLogs: false },
  );
  return {
    embeds: [
      successEmbed(
        "Template appliqué",
        `**${template.label}** (\`${templateKey}\`) a été appliqué.\nUtilise \`/logs create\` si tu veux les salons logs.`,
      ),
    ],
  };
}

export async function handleTemplateReset(
  interaction: ChatInputCommandInteraction,
  _client: import("discord.js").Client,
): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const result = await templateService.resetGuildStructure(interaction.guild!, interaction.user.id);
  const embed = warningEmbed(
    "Reset terminé",
    "Nettoyage complet du serveur exécuté.",
  );
  embed.addFields(
    { name: "Salons supprimés", value: String(result.deletedChannels), inline: true },
    { name: "Catégories supprimées", value: String(result.deletedCategories), inline: true },
    { name: "Rôles supprimés", value: String(result.deletedRoles), inline: true },
  );
  return { embeds: [embed] };
}
