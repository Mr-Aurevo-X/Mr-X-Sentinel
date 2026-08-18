import type { Interaction } from "discord.js";
import { customCommandService, type ModerationService } from "@sentinel/core";
import { handleComponent, handleModal } from "../interaction-router.js";
import { withCommand } from "./middleware.js";
import { assertSlashAccess } from "./permissions.js";
import { buildCommandRegistry } from "./registry.js";
import { errorEmbed } from "../ui/embeds.js";

export async function handleInteraction(
  interaction: Interaction,
  moderation: ModerationService,
  client: import("discord.js").Client,
): Promise<void> {
  if (interaction.isModalSubmit() && interaction.guild) {
    await handleModal(interaction, client);
    return;
  }

  if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
    await handleComponent(interaction, client, moderation);
    return;
  }

  if (!interaction.isChatInputCommand() || !interaction.guild) return;

  try {
    await assertSlashAccess(interaction);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Accès refusé.";
    await interaction
      .reply({ embeds: [errorEmbed("Accès refusé", msg)], ephemeral: true })
      .catch(() => undefined);
    return;
  }

  const entry = buildCommandRegistry(moderation)[interaction.commandName];
  if (!entry) {
    const row = await customCommandService.get(interaction.guild.id, interaction.commandName);
    if (row) {
      await interaction
        .reply({ content: row.body, allowedMentions: { parse: [] } })
        .catch(() => undefined);
    }
    return;
  }
  await withCommand(entry.handler, entry.options)(interaction, client);
}
