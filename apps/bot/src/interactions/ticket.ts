import type { GuildMember, ModalSubmitInteraction, Client } from "discord.js";
import { ticketService } from "@sentinel/core";
import { parseCustomId } from "@sentinel/shared";
import { buildTicketRow, buildTicketReasonModal } from "../commands/handlers/tickets.js";
import { buildSimpleEmbed, buildTicketOpenEmbed, successEmbed } from "../ui/embeds.js";
import type { ComponentHandler } from "./types.js";

export async function handleModal(interaction: ModalSubmitInteraction, client: Client): Promise<void> {
  if (!interaction.guild) return;
  const parsed = parseCustomId(interaction.customId);
  if (!parsed || parsed.module !== "ticket" || parsed.action !== "modal") return;

  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild;
  const member = interaction.member as GuildMember;
  const type = parsed.extra ?? "support";
  const reason = interaction.fields.getTextInputValue("reason");
  const ch = await ticketService.openTicket(guild, member, client, type);
  await ch.send({
    embeds: [buildTicketOpenEmbed(member.user), buildSimpleEmbed("Raison", reason)],
    components: buildTicketRow(ch.id),
  });
  await interaction.editReply({ embeds: [successEmbed("Ticket créé", `<#${ch.id}>`)] });
}

export const handleTicketComponent: ComponentHandler = async ({ interaction, client, guild, parsed }) => {
  const member = interaction.member as GuildMember;
  if (parsed.action === "type" && interaction.isStringSelectMenu()) {
    const ticketType = interaction.values[0] ?? "support";
    await interaction.showModal(buildTicketReasonModal(ticketType));
    return;
  }
  if (parsed.action === "open") {
    await interaction.deferReply({ ephemeral: true });
    const ch = await ticketService.openTicket(guild, member, client);
    await interaction.editReply({ embeds: [successEmbed("Ticket", `<#${ch.id}>`)] });
    await ch.send({ embeds: [buildTicketOpenEmbed(member.user)], components: buildTicketRow(ch.id) });
    return;
  }
  const channelId = parsed.extra ?? interaction.channelId;
  if (parsed.action === "claim") {
    await ticketService.claim(channelId, interaction.user.id, client);
    await interaction.reply({ embeds: [successEmbed("Claim", "Ticket pris en charge.")], ephemeral: true });
    return;
  }
  if (parsed.action === "close") {
    await interaction.deferReply({ ephemeral: true });
    await ticketService.close(channelId, client);
    await interaction.editReply({ embeds: [successEmbed("Fermé", "Ticket fermé.")] });
  }
};
