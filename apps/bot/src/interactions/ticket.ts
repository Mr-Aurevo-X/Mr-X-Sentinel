import type { GuildMember, ModalSubmitInteraction, Client } from "discord.js";
import { ticketService } from "@sentinel/core";
import { parseCustomId } from "@sentinel/shared";
import { buildTicketRow, buildTicketReasonModal } from "../commands/handlers/tickets.js";
import { buildSimpleEmbed, buildTicketOpenEmbed, successEmbed } from "../ui/embeds.js";
import { ackComponent, ephemeralComponent } from "../commands/ack.js";
import type { ComponentHandler } from "./types.js";

export async function handleModal(interaction: ModalSubmitInteraction, client: Client): Promise<void> {
  if (!interaction.guild) return;
  const parsed = parseCustomId(interaction.customId);
  if (!parsed || parsed.module !== "ticket" || parsed.action !== "modal") return;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }
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
    await ackComponent(interaction, "ephemeral");
    const ch = await ticketService.openTicket(guild, member, client);
    await interaction.editReply({ embeds: [successEmbed("Ticket", `<#${ch.id}>`)] });
    await ch.send({ embeds: [buildTicketOpenEmbed(member.user)], components: buildTicketRow(ch.id) });
    return;
  }
  const channelId = parsed.extra ?? interaction.channelId;
  if (parsed.action === "claim") {
    await ticketService.claim(channelId, interaction.user.id, client);
    await ephemeralComponent(interaction, { embeds: [successEmbed("Claim", "Ticket pris en charge.")] });
    return;
  }
  if (parsed.action === "close") {
    await ackComponent(interaction, "ephemeral");
    await ticketService.close(channelId, client);
    await interaction.editReply({ embeds: [successEmbed("Fermé", "Ticket fermé.")] });
  }
};
