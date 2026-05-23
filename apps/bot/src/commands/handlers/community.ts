import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { ChannelType } from "discord.js";
import {
  giveawayService,
  pollService,
  reactionRoleService,
} from "@sentinel/core";
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
