import { prisma } from "@sentinel/database";
import type { Client, MessageReaction, PartialMessageReaction, User, PartialUser } from "discord.js";

export class ReactionRoleService {
  async add(guildId: string, channelId: string, messageId: string, emoji: string, roleId: string) {
    return prisma.reactionRole.create({
      data: { guildId, channelId, messageId, emoji, roleId },
    });
  }

  async remove(guildId: string, messageId: string, emoji: string) {
    await prisma.reactionRole.deleteMany({ where: { guildId, messageId, emoji } });
  }

  async list(guildId: string) {
    return prisma.reactionRole.findMany({ where: { guildId }, orderBy: { createdAt: "desc" } });
  }

  async handleReaction(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    add: boolean,
    _client: Client,
  ) {
    if (user.bot || !reaction.message.guild) return;
    const messageId = reaction.message.id;
    const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name ?? "";
    const row = await prisma.reactionRole.findFirst({
      where: { guildId: reaction.message.guild.id, messageId, emoji },
    });
    if (!row) return;
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    if (add) await member.roles.add(row.roleId, "Reaction role").catch(() => undefined);
    else await member.roles.remove(row.roleId, "Reaction role removed").catch(() => undefined);
  }
}

export const reactionRoleService = new ReactionRoleService();
