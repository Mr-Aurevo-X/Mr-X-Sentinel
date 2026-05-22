import type { Guild, GuildMember } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import { prisma } from "@sentinel/database";
import {
  LOG_CATEGORY_NAME,
  LOG_CHANNEL_NAMES,
  LOG_ROLE_NAME,
  LOG_TYPES,
  type LogType,
} from "@sentinel/shared";
import { logger } from "../logger.js";

const creatingGuilds = new Set<string>();

export class LogProvisioningService {
  isCreating(guildId: string): boolean {
    return creatingGuilds.has(guildId);
  }

  async provisionAll(guild: Guild, actorId?: string): Promise<Record<LogType, string>> {
    if (creatingGuilds.has(guild.id)) {
      throw new Error("Création des salons logs déjà en cours.");
    }

    const me = guild.members.me;
    if (
      !me?.permissions.has(PermissionFlagsBits.ManageChannels) ||
      !me.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      throw new Error("Le bot a besoin de Manage Channels et Manage Roles.");
    }

    creatingGuilds.add(guild.id);
    try {
      const logsRole = await this.ensureLogsRole(guild);
      const category = await this.ensureCategory(guild, logsRole);
      const result = {} as Record<LogType, string>;

      for (const logType of LOG_TYPES) {
        const channelName = LOG_CHANNEL_NAMES[logType];
        let channel = guild.channels.cache.find(
          (c) => c.name === channelName && c.type === ChannelType.GuildText,
        );
        if (!channel || channel.type !== ChannelType.GuildText) {
          channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            reason: "Mr-X Sentinel — création salons logs",
          });
        } else if (channel.parentId !== category.id) {
          await channel.setParent(category.id).catch(() => undefined);
        }

        await prisma.guildLogChannel.upsert({
          where: { guildId_logType: { guildId: guild.id, logType } },
          create: { guildId: guild.id, logType, channelId: channel.id },
          update: { channelId: channel.id },
        });
        result[logType] = channel.id;
      }

      if (result.moderation) {
        await prisma.guild.update({
          where: { id: guild.id },
          data: { modLogChannelId: result.moderation },
        });
      }

      logger.info({ guildId: guild.id, actorId }, "Log channels provisioned");
      return result;
    } finally {
      creatingGuilds.delete(guild.id);
    }
  }

  private async ensureLogsRole(guild: Guild) {
    let role = guild.roles.cache.find((r) => r.name === LOG_ROLE_NAME);
    if (!role) {
      role = await guild.roles.create({
        name: LOG_ROLE_NAME,
        reason: "Mr-X Sentinel — rôle logs",
      });
    }
    return role;
  }

  private async ensureCategory(guild: Guild, logsRole: { id: string }) {
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === LOG_CATEGORY_NAME,
    );

    const me = guild.members.me as GuildMember;
    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
        ],
      },
      {
        id: logsRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages],
      },
    ];

    if (guild.ownerId) {
      overwrites.push({
        id: guild.ownerId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      });
    }

    if (!category || category.type !== ChannelType.GuildCategory) {
      category = await guild.channels.create({
        name: LOG_CATEGORY_NAME,
        type: ChannelType.GuildCategory,
        permissionOverwrites: overwrites,
        reason: "Mr-X Sentinel — catégorie logs",
      });
    } else {
      await category.permissionOverwrites.set(overwrites);
    }
    return category;
  }
}

export const logProvisioningService = new LogProvisioningService();
