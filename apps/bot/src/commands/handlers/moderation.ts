import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import type { ModerationService } from "@sentinel/core";
import { prisma } from "@sentinel/database";
import { buildSimpleEmbed, successEmbed, warningEmbed } from "../../ui/embeds.js";
import { buildModerationConfirmRows } from "../../views/ModerationViews.js";
import type { CommandReply } from "../middleware.js";

export async function handleBan(
  interaction: ChatInputCommandInteraction,
  mod: ModerationService,
): Promise<CommandReply> {
  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", true);
  const days = interaction.options.getInteger("delete_days") ?? 1;
  await mod.ban(interaction.guild!.id, user.id, interaction.user, reason, days);
  return { embeds: [successEmbed("Ban", `${user.tag} banni.`)] };
}

export async function handleUnban(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const userId = interaction.options.getString("user_id", true);
  await interaction.guild!.members.unban(userId).catch(() => undefined);
  return { embeds: [successEmbed("Unban", `Membre \`${userId}\` débanni.`)] };
}

export async function handleKick(
  interaction: ChatInputCommandInteraction,
  mod: ModerationService,
): Promise<CommandReply> {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const reason = interaction.options.getString("reason", true);
  await mod.kick(member, interaction.user, reason);
  return { embeds: [successEmbed("Kick", `${member.user.tag} expulsé.`)] };
}

export async function handleMute(
  interaction: ChatInputCommandInteraction,
  mod: ModerationService,
): Promise<CommandReply> {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const reason = interaction.options.getString("reason", true);
  const minutes = interaction.options.getInteger("minutes", true);
  await mod.mute(member, interaction.user, reason, minutes * 60_000);
  return { embeds: [successEmbed("Mute", `${member.user.tag} mute ${minutes} min.`)] };
}

export async function handleUnmute(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  await member.timeout(null);
  return { embeds: [successEmbed("Unmute", "Timeout retiré.")] };
}

export async function handleWarn(
  interaction: ChatInputCommandInteraction,
  mod: ModerationService,
): Promise<CommandReply> {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const reason = interaction.options.getString("reason", true);
  await mod.warn(member, interaction.user, reason);
  return { embeds: [successEmbed("Warn", "Avertissement enregistré.")] };
}

export async function handleWarnings(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const user = interaction.options.getUser("user", true);
  const rec = await prisma.guildMemberRecord.findUnique({
    where: { guildId_userId: { guildId: interaction.guild!.id, userId: user.id } },
  });
  return {
    embeds: [buildSimpleEmbed("Avertissements", `${user.tag} — **${rec?.warnCount ?? 0}** warn(s).`)],
  };
}

export async function handleClear(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const amount = interaction.options.getInteger("amount", true);
  const channel = interaction.channel;
  if (!channel?.isTextBased() || channel.isDMBased()) throw new Error("Salon invalide");
  const deleted = await channel.bulkDelete(amount, true);
  return { embeds: [successEmbed("Clear", `${deleted.size} messages supprimés.`)] };
}

export async function handleNuke(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  return {
    embeds: [
      warningEmbed(
        "Nuke salon",
        "⚠️ **Action destructive** — ce salon sera cloné puis supprimé.\nConfirme pour continuer.",
      ),
    ],
    components: buildModerationConfirmRows("nuke", interaction.channelId),
  };
}

export async function handleSoftban(
  interaction: ChatInputCommandInteraction,
  mod: ModerationService,
): Promise<CommandReply> {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const reason = interaction.options.getString("reason", true);
  await mod.softban(member, interaction.user, reason);
  return { embeds: [successEmbed("Softban", `${member.user.tag} softban (messages purgés).`)] };
}
