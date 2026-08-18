import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";
import {
  giveawayService,
  pollService,
  reactionRoleService,
} from "@sentinel/core";
import { customId } from "@sentinel/shared";
import { getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handlePoll(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  if (sub === "create") {
    const question = interaction.options.getString("question", true);
    const opt1 = interaction.options.getString("option1", true);
    const opt2 = interaction.options.getString("option2", true);
    const opt3 = interaction.options.getString("option3");
    const opt4 = interaction.options.getString("option4");
    const channel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;
    if (!channel || channel.type !== ChannelType.GuildText) throw new Error("Salon texte requis.");
    const options = [opt1, opt2, opt3, opt4].filter(Boolean) as string[];
    const duration = interaction.options.getInteger("duration_hours") ?? undefined;
    await pollService.create(channel, interaction.user.id, question, options, duration);
    return { embeds: [successEmbed("Sondage créé", `Publié dans <#${channel.id}>.`)] };
  }
  const polls = await pollService.list(interaction.guild!.id);
  const lines = polls.map((p) => `• **${p.question}** — <#${p.channelId}>`).join("\n") || "Aucun sondage.";
  return { embeds: [buildSimpleEmbed("Sondages", lines)] };
}

export async function handleGiveaway(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "create") {
    const prize = interaction.options.getString("prize", true);
    const hours = interaction.options.getInteger("duration_hours", true);
    const winners = interaction.options.getInteger("winners") ?? 1;
    const channel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;
    if (!channel || channel.type !== ChannelType.GuildText) throw new Error("Salon texte requis.");
    await giveawayService.create(channel, interaction.user.id, prize, hours, winners);
    return { embeds: [successEmbed("Giveaway lancé", `Fin dans **${hours}h**.`)] };
  }
  if (sub === "end") {
    const id = interaction.options.getString("id", true);
    const winners = await giveawayService.end(interaction.client, id);
    return { embeds: [successEmbed("Giveaway terminé", winners?.length ? `${winners.length} gagnant(s).` : "Aucun participant.")] };
  }
  const active = await giveawayService.listActive(guildId);
  const lines = active.map((g) => `\`${g.id}\` **${g.prize}** — <t:${Math.floor(g.endsAt.getTime() / 1000)}:R>`).join("\n") || "Aucun giveaway actif.";
  return { embeds: [buildSimpleEmbed("Giveaways actifs", lines)] };
}

export async function handleReactionRole(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "add") {
    const channel = interaction.options.getChannel("channel", true);
    const messageId = interaction.options.getString("message_id", true);
    const emoji = interaction.options.getString("emoji", true);
    const role = interaction.options.getRole("role", true);
    if (channel.type !== ChannelType.GuildText) throw new Error("Salon texte requis.");
    const msg = await (channel as TextChannel).messages.fetch(messageId).catch(() => null);
    if (!msg) throw new Error("Message introuvable.");
    await msg.react(emoji).catch(() => undefined);
    await reactionRoleService.add(guildId, channel.id, messageId, emoji, role.id);
    return { embeds: [successEmbed("Reaction role", `${emoji} → ${role.name}`)] };
  }
  if (sub === "remove") {
    const messageId = interaction.options.getString("message_id", true);
    const emoji = interaction.options.getString("emoji", true);
    await reactionRoleService.remove(guildId, messageId, emoji);
    return { embeds: [successEmbed("Reaction role retiré", `${emoji} sur \`${messageId}\`.`)] };
  }
  const rows = await reactionRoleService.list(guildId);
  const lines = rows.map((r) => `${r.emoji} → <@&${r.roleId}> (\`${r.messageId}\`)`).join("\n") || "Aucun.";
  return { embeds: [buildSimpleEmbed("Reaction roles", lines)] };
}

export async function handleStarboard(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "setup") {
    const channel = interaction.options.getChannel("channel", true);
    const threshold = interaction.options.getInteger("threshold") ?? 3;
    await updateGuildConfig(guildId, {
      starboard: { enabled: true, channelId: channel.id, threshold },
    });
    return { embeds: [successEmbed("Starboard", `Salon <#${channel.id}> · seuil **${threshold}**.`)] };
  }
  if (sub === "off") {
    const current = await getGuildConfig(guildId);
    await updateGuildConfig(guildId, {
      starboard: { ...current.starboard, enabled: false },
    });
    return { embeds: [successEmbed("Starboard", "Désactivé.")] };
  }
  const cfg = await getGuildConfig(guildId);
  return {
    embeds: [
      buildSimpleEmbed(
        "Starboard",
        `État : **${cfg.starboard.enabled ? "on" : "off"}**\nSalon : ${cfg.starboard.channelId ? `<#${cfg.starboard.channelId}>` : "—"}\nSeuil : **${cfg.starboard.threshold}**`,
      ),
    ],
  };
}

export async function handleVerify(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "setup") {
    const channel = interaction.options.getChannel("channel", true);
    const verified = interaction.options.getRole("verified", true);
    const unverified = interaction.options.getRole("unverified");
    await updateGuildConfig(guildId, {
      verification: {
        enabled: true,
        channelId: channel.id,
        verifiedRoleId: verified.id,
        unverifiedRoleId: unverified?.id ?? null,
        useTurnstile: false,
      },
    });
    return {
      embeds: [successEmbed("Vérification", `Salon <#${channel.id}> · rôle <@&${verified.id}>.`)],
    };
  }
  if (sub === "off") {
    const current = await getGuildConfig(guildId);
    await updateGuildConfig(guildId, {
      verification: { ...current.verification, enabled: false },
    });
    return { embeds: [successEmbed("Vérification", "Désactivée.")] };
  }
  const cfg = await getGuildConfig(guildId);
  if (!cfg.verification.enabled || !cfg.verification.verifiedRoleId) {
    throw new Error("Configure d'abord **/verify setup**.");
  }
  const target = cfg.verification.channelId
    ? await interaction.guild!.channels.fetch(cfg.verification.channelId).catch(() => null)
    : interaction.channel;
  if (!target || !target.isTextBased() || target.isDMBased() || !("send" in target)) {
    throw new Error("Salon de vérification introuvable.");
  }
  await target.send({
    embeds: [buildSimpleEmbed("Vérification", "Clique pour obtenir l'accès au serveur.")],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(customId("verify", "ok"))
          .setLabel("Vérifier")
          .setStyle(ButtonStyle.Success),
      ),
    ],
  });
  return { embeds: [successEmbed("Vérification", `Bouton publié dans <#${target.id}>.`)] };
}
