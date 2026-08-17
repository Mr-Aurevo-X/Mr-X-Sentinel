import type { TextChannel } from "discord.js";
import {
  buildSimpleEmbed,
  successEmbed,
  warningEmbed,
} from "../ui/embeds.js";
import { buildModerationConfirmRows, buildModPanelUserSelect } from "../views/ModerationViews.js";
import type { ComponentHandler } from "./types.js";

export const handleModComponent: ComponentHandler = async ({ interaction, moderation, guild, parsed }) => {
  if (parsed.action === "cancel") {
    await interaction.update({ embeds: [buildSimpleEmbed("Annulé", "Action annulée.")], components: [] });
    return;
  }
  if (parsed.action !== "confirm" || !parsed.extra) return;

  const colon = parsed.extra.indexOf(":");
  if (colon === -1) return;
  const modAction = parsed.extra.slice(0, colon);
  const targetId = parsed.extra.slice(colon + 1);
  const reason = "Via panel modération Mr-X Sentinel";
  await interaction.deferUpdate();

  if (modAction === "nuke") {
    const channel = guild.channels.cache.get(targetId);
    if (!channel?.isTextBased() || channel.isDMBased() || !("clone" in channel)) {
      throw new Error("Salon introuvable ou non clonable.");
    }
    const textChannel = channel as TextChannel;
    const position = textChannel.position;
    const clone = await textChannel.clone({ reason: "Mr-X Sentinel nuke" });
    await clone.setPosition(position);
    await channel.delete("Nuke");
    await clone.send({ embeds: [successEmbed("Nuke", "Salon recréé par Mr-X Sentinel.")] });
    return;
  }

  if (modAction === "clear") {
    const channel = guild.channels.cache.get(targetId);
    if (!channel?.isTextBased() || channel.isDMBased()) throw new Error("Salon invalide.");
    const deleted = await channel.bulkDelete(10, true);
    await interaction.editReply({
      embeds: [successEmbed("Clear", `${deleted.size} messages supprimés.`)],
      components: [],
    });
    return;
  }

  const targetMember = await guild.members.fetch(targetId).catch(() => null);
  if (!targetMember) throw new Error("Membre introuvable.");

  if (modAction === "warn") {
    await moderation.warn(targetMember, interaction.user, reason);
    await interaction.editReply({
      embeds: [successEmbed("Warn", `<@${targetId}> averti.`)],
      components: [],
    });
    return;
  }
  if (modAction === "mute") {
    await moderation.mute(targetMember, interaction.user, reason, 10 * 60 * 1000);
    await interaction.editReply({
      embeds: [successEmbed("Mute", `<@${targetId}> mute 10 min.`)],
      components: [],
    });
    return;
  }
  if (modAction === "kick") {
    await moderation.kick(targetMember, interaction.user, reason);
    await interaction.editReply({
      embeds: [successEmbed("Kick", `<@${targetId}> expulsé.`)],
      components: [],
    });
    return;
  }
  if (modAction === "ban") {
    await moderation.ban(guild.id, targetId, interaction.user, reason);
    await interaction.editReply({
      embeds: [successEmbed("Ban", `<@${targetId}> banni.`)],
      components: [],
    });
  }
};

export const handleModPanelComponent: ComponentHandler = async ({ interaction, parsed }) => {
  if (parsed.action === "select" && interaction.isUserSelectMenu() && parsed.extra) {
    const modAction = parsed.extra;
    const targetId = interaction.values[0]!;
    await interaction.update({
      embeds: [
        warningEmbed(
          `Confirmer — ${modAction}`,
          `Cible : <@${targetId}>\nRaison par défaut : panel modération.`,
        ),
      ],
      components: buildModerationConfirmRows(modAction, targetId),
    });
    return;
  }

  const action = parsed.action;
  if (action === "clear") {
    await interaction.reply({
      embeds: [warningEmbed("Clear", "Supprimer les **10** derniers messages de ce salon ?")],
      components: buildModerationConfirmRows("clear", interaction.channelId),
      ephemeral: true,
    });
    return;
  }
  if (action === "nuke") {
    await interaction.reply({
      embeds: [
        warningEmbed("Nuke salon", "Ce salon sera cloné puis supprimé. Confirme pour continuer."),
      ],
      components: buildModerationConfirmRows("nuke", interaction.channelId),
      ephemeral: true,
    });
    return;
  }
  if (["warn", "mute", "kick", "ban"].includes(action)) {
    await interaction.reply({
      embeds: [buildSimpleEmbed("Panel mod", `Sélectionne le membre pour **${action}**.`)],
      components: buildModPanelUserSelect(action),
      ephemeral: true,
    });
  }
};
