import type { ChatInputCommandInteraction } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  type TextChannel,
  type GuildMember,
} from "discord.js";
import { ticketService, shopService } from "@sentinel/core";
import { customId } from "@sentinel/shared";
import { buildTicketOpenEmbed, buildTicketPanelEmbed, buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";
import { memberHasAdmin, memberHasTicketMod } from "../permissions.js";

export function buildTicketPanelRows(): ActionRowBuilder<StringSelectMenuBuilder>[] {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId("ticket", "type"))
        .setPlaceholder("Type de ticket")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Support").setValue("support").setEmoji("🛠️"),
          new StringSelectMenuOptionBuilder().setLabel("Question").setValue("question").setEmoji("❓"),
          new StringSelectMenuOptionBuilder().setLabel("Bug").setValue("bug").setEmoji("🐛"),
          new StringSelectMenuOptionBuilder().setLabel("Autre").setValue("other").setEmoji("📋"),
        ),
    ),
  ];
}

export function buildTicketReasonModal(ticketType: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(customId("ticket", "modal", ticketType))
    .setTitle("Ouvrir un ticket")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Décris ta demande")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500),
      ),
    );
}

export function buildTicketRow(channelId: string): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("ticket", "claim", channelId))
        .setLabel("Claim")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customId("ticket", "close", channelId))
        .setLabel("Fermer")
        .setStyle(ButtonStyle.Danger),
    ),
  ];
}

export async function handleTicket(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;
  const member = interaction.member as GuildMember;

  if (sub === "open") {
    const ch = await ticketService.openTicket(guild, member, client);
    await ch.send({
      embeds: [buildTicketOpenEmbed(member.user)],
      components: buildTicketRow(ch.id),
    });
    return { embeds: [successEmbed("Ticket créé", `Salon : <#${ch.id}>`)] };
  }

  if (sub === "setup") {
    if (!memberHasAdmin(member)) {
      throw new Error("Permission administrateur ou gérant requise.");
    }
    const panel = interaction.options.getChannel("panel", true);
    if (panel.type !== ChannelType.GuildText) throw new Error("Salon texte requis.");
    const panelCh = panel as TextChannel;
    const supportRole = interaction.options.getRole("support_role");
    await ticketService.saveConfig(guild.id, {
      panelChannelId: panelCh.id,
      supportRoleIds: supportRole ? [supportRole.id] : [],
    });
    await panelCh.send({
      embeds: [buildTicketPanelEmbed()],
      components: buildTicketPanelRows(),
    });
    return { embeds: [successEmbed("Panneau tickets", "Publié dans le salon choisi.")] };
  }

  if (!memberHasTicketMod(member)) throw new Error("Permission modération requise.");

  if (sub === "close") {
    await ticketService.close(interaction.channelId, client);
    return { embeds: [successEmbed("Ticket fermé", "Le salon sera supprimé.")] };
  }

  if (sub === "reopen") {
    const user = interaction.options.getUser("user", true);
    const target = await guild.members.fetch(user.id);
    const ch = await ticketService.reopen(guild, target.id, client);
    await ch.send({
      embeds: [buildTicketOpenEmbed(target.user)],
      components: buildTicketRow(ch.id),
    });
    return { embeds: [successEmbed("Ticket rouvert", `<#${ch.id}> pour <@${user.id}>`)] };
  }

  if (sub === "add") {
    const user = interaction.options.getUser("user", true);
    await ticketService.addMember(interaction.channelId, user.id, client);
    return { embeds: [successEmbed("Membre ajouté", `<@${user.id}> peut voir ce ticket.`)] };
  }

  if (sub === "remove") {
    const user = interaction.options.getUser("user", true);
    await ticketService.removeMember(interaction.channelId, user.id, client);
    return { embeds: [successEmbed("Membre retiré", `<@${user.id}> retiré du ticket.`)] };
  }

  if (sub === "rename") {
    const name = interaction.options.getString("name", true);
    const ch = guild.channels.cache.get(interaction.channelId);
    if (!ch) throw new Error("Salon introuvable.");
    await ch.setName(name.slice(0, 100), "Ticket rename");
    return { embeds: [successEmbed("Ticket renommé", `**${name}**`)] };
  }

  if (sub === "config") {
    const cfg = await ticketService.getConfig(guild.id);
    return {
      embeds: [
        buildSimpleEmbed(
          "Config tickets",
          `Panneau : ${cfg.panelChannelId ? `<#${cfg.panelChannelId}>` : "—"}\nSupport : ${cfg.supportRoleIds.map((id) => `<@&${id}>`).join(" ") || "—"}`,
        ),
      ],
    };
  }

  await ticketService.claim(interaction.channelId, interaction.user.id, client);
  return { embeds: [successEmbed("Ticket claim", "Tu as pris en charge ce ticket.")] };
}

export async function handleAdminShopAdd(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const name = interaction.options.getString("name", true);
  const price = interaction.options.getInteger("price", true);
  const role = interaction.options.getRole("role");
  const item = await shopService.add(interaction.guild!.id, name, price, role?.id);
  const { formatMoney } = await import("@sentinel/shared");
  return {
    embeds: [successEmbed("Article ajouté", `\`${item.id}\` **${name}** — ${formatMoney(price)}`)],
  };
}

export async function handleAdminShopRemove(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const itemId = interaction.options.getString("item_id", true);
  await shopService.remove(interaction.guild!.id, itemId);
  return { embeds: [successEmbed("Article retiré", `\`${itemId}\` supprimé de la boutique.`)] };
}
