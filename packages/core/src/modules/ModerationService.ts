import type { GuildMember, User } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { prisma, nextCaseNumber } from "@sentinel/database";
import type { ModCaseType } from "@sentinel/shared";
import { modLogService } from "../services/ModLogService.js";
import type { Client } from "discord.js";

export class ModerationService {
  constructor(private client: Client) {}

  async createCase(
    guildId: string,
    type: ModCaseType,
    target: User,
    moderator: User,
    reason: string,
    options?: { durationMs?: number; proof?: string },
  ) {
    const caseNumber = await nextCaseNumber(guildId);
    const modCase = await prisma.modCase.create({
      data: {
        guildId,
        caseNumber,
        type,
        targetId: target.id,
        moderatorId: moderator.id,
        reason,
        proof: options?.proof,
        durationMs: options?.durationMs,
      },
    });

    const embed = new EmbedBuilder()
      .setTitle(`Case #${caseNumber} — ${type}`)
      .addFields(
        { name: "Membre", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Modérateur", value: `${moderator.tag}`, inline: true },
        { name: "Raison", value: reason },
      )
      .setTimestamp();

    await modLogService.logModAction(this.client, guildId, embed);
    return modCase;
  }

  async warn(member: GuildMember, moderator: User, reason: string) {
    await this.createCase(member.guild.id, "WARN", member.user, moderator, reason);
    await prisma.guildMemberRecord.upsert({
      where: { guildId_userId: { guildId: member.guild.id, userId: member.id } },
      create: { guildId: member.guild.id, userId: member.id, warnCount: 1 },
      update: { warnCount: { increment: 1 } },
    });
  }

  async mute(member: GuildMember, moderator: User, reason: string, durationMs: number) {
    await member.timeout(durationMs, reason);
    await this.createCase(member.guild.id, "MUTE", member.user, moderator, reason, {
      durationMs,
    });
  }

  async kick(member: GuildMember, moderator: User, reason: string) {
    await this.createCase(member.guild.id, "KICK", member.user, moderator, reason);
    await member.kick(reason);
  }

  async ban(guildId: string, userId: string, moderator: User, reason: string, deleteDays = 1) {
    const guild = await this.client.guilds.fetch(guildId);
    const user = await this.client.users.fetch(userId);
    await guild.members.ban(userId, { reason, deleteMessageSeconds: deleteDays * 86400 });
    await this.createCase(guildId, "BAN", user, moderator, reason);
  }
}
