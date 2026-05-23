import type { Client, Guild, GuildMember, TextChannel } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import { prisma, getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { logService } from "../../services/LogService.js";

export class TicketService {
  async getConfig(guildId: string) {
    const cfg = await getGuildConfig(guildId);
    return cfg.tickets;
  }

  async saveConfig(guildId: string, patch: Partial<Awaited<ReturnType<typeof this.getConfig>>>) {
    const cfg = await getGuildConfig(guildId);
    await updateGuildConfig(guildId, { tickets: { ...cfg.tickets, ...patch } });
  }

  async ensureCategory(guild: Guild): Promise<string> {
    const config = await this.getConfig(guild.id);
    if (config.categoryId) {
      const ch = guild.channels.cache.get(config.categoryId);
      if (ch) return config.categoryId;
    }
    const cat = await guild.channels.create({
      name: "Tickets",
      type: ChannelType.GuildCategory,
      reason: "Mr-X Sentinel tickets",
    });
    await this.saveConfig(guild.id, { categoryId: cat.id });
    return cat.id;
  }

  async openTicket(
    guild: Guild,
    member: GuildMember,
    client: Client,
    type = "support",
  ): Promise<TextChannel> {
    const existing = await prisma.ticketChannel.findFirst({
      where: { guildId: guild.id, ownerId: member.id, status: "open" },
    });
    if (existing) {
      const ch = guild.channels.cache.get(existing.channelId);
      if (ch?.isTextBased()) throw new Error(`Tu as déjà un ticket : <#${existing.channelId}>`);
    }

    const categoryId = await this.ensureCategory(guild);
    const config = await this.getConfig(guild.id);
    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: guild.members.me!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ];
    for (const roleId of config.supportRoleIds ?? []) {
      overwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
        ],
      });
    }

    const channel = await guild.channels.create({
      name: `ticket-${member.user.username}`.slice(0, 100),
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: overwrites,
      topic: `Ticket ${type} — ${member.id}`,
      reason: `Ticket ouvert par ${member.user.tag}`,
    });

    await prisma.ticketChannel.create({
      data: {
        guildId: guild.id,
        channelId: channel.id,
        ownerId: member.id,
        status: "open",
        ticketType: type,
      },
    });

    await logService.log(client, guild.id, "tickets", {
      title: "Ticket ouvert",
      description: `<@${member.id}> — <#${channel.id}>`,
      actorId: member.id,
    });

    return channel;
  }

  async claim(channelId: string, staffId: string, client: Client) {
    const ticket = await prisma.ticketChannel.update({
      where: { channelId },
      data: { status: "claimed", claimedBy: staffId },
    });
    await logService.log(client, ticket.guildId, "tickets", {
      title: "Ticket claim",
      description: `<@${staffId}> a pris <#${channelId}>`,
      actorId: staffId,
    });
  }

  async close(channelId: string, client: Client) {
    const ticket = await prisma.ticketChannel.update({
      where: { channelId },
      data: { status: "closed" },
    });
    const guild = await client.guilds.fetch(ticket.guildId);
    const ch = guild.channels.cache.get(channelId);
    if (ch) await ch.delete("Ticket fermé").catch(() => undefined);
    await logService.log(client, ticket.guildId, "tickets", {
      title: "Ticket fermé",
      description: `<#${channelId}>`,
    });
  }

  async reopen(guild: Guild, ownerId: string, client: Client): Promise<TextChannel> {
    const member = await guild.members.fetch(ownerId);
    return this.openTicket(guild, member, client);
  }

  async addMember(channelId: string, userId: string, client: Client) {
    const ticket = await prisma.ticketChannel.findUnique({ where: { channelId } });
    if (!ticket) throw new Error("Ticket introuvable.");
    const guild = await client.guilds.fetch(ticket.guildId);
    const ch = guild.channels.cache.get(channelId);
    if (!ch?.isTextBased() || !("permissionOverwrites" in ch)) {
      throw new Error("Salon ticket introuvable.");
    }
    await ch.permissionOverwrites.edit(userId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
  }

  async removeMember(channelId: string, userId: string, client: Client) {
    const ticket = await prisma.ticketChannel.findUnique({ where: { channelId } });
    if (!ticket) throw new Error("Ticket introuvable.");
    if (userId === ticket.ownerId) throw new Error("Impossible de retirer le propriétaire du ticket.");
    const guild = await client.guilds.fetch(ticket.guildId);
    const ch = guild.channels.cache.get(channelId);
    if (!ch?.isTextBased() || !("permissionOverwrites" in ch)) {
      throw new Error("Salon ticket introuvable.");
    }
    await ch.permissionOverwrites.delete(userId);
  }
}

export const ticketService = new TicketService();
