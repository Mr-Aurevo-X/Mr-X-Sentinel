import type { Interaction } from "discord.js";
import { customCommandService, type ModerationService } from "@sentinel/core";
import { handleComponent, handleModal } from "../interaction-router.js";
import { replyPayload, withCommand } from "./middleware.js";
import { assertSlashAccess } from "./permissions.js";
import { buildCommandRegistry } from "./registry.js";
import { errorEmbed } from "../ui/embeds.js";
import {
  INFRA_UNAVAILABLE_MESSAGE,
  isInfraUnavailableError,
  resolveCommandEphemeral,
  shouldDeferSlash,
} from "./ack.js";

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

  const entry = buildCommandRegistry(moderation)[interaction.commandName];
  const ephemeral = entry ? resolveCommandEphemeral(entry.options ?? {}, interaction) : false;

  if (shouldDeferSlash(interaction.commandName) && !interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral });
  }

  try {
    await assertSlashAccess(interaction);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Accès refusé.";
    await replyPayload(interaction, { embeds: [errorEmbed("Accès refusé", msg)] }, true).catch(
      () => undefined,
    );
    return;
  }

  if (!entry) {
    try {
      const row = await customCommandService.get(interaction.guild.id, interaction.commandName);
      if (row) {
        const body = { content: row.body, allowedMentions: { parse: [] as const } };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(body);
        } else {
          await interaction.reply(body);
        }
        return;
      }
      await replyPayload(
        interaction,
        { embeds: [errorEmbed("Inconnue", "Commande inconnue.")] },
        true,
      );
    } catch (err) {
      const msg = isInfraUnavailableError(err)
        ? INFRA_UNAVAILABLE_MESSAGE
        : err instanceof Error
          ? err.message
          : "Erreur inconnue";
      await replyPayload(
        interaction,
        { embeds: [errorEmbed(isInfraUnavailableError(err) ? "Base indisponible" : "Erreur", msg)] },
        true,
      ).catch(() => undefined);
    }
    return;
  }
  await withCommand(entry.handler, entry.options)(interaction, client);
}
