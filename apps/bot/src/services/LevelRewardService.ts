import type { Guild, GuildMember, Role } from "discord.js";
import { getGuildConfig } from "@sentinel/database";
import {
  getRewardColour,
  getRewardLevel,
  getRewardRoleName,
  isLevelRewardRoleName,
  logger,
} from "@sentinel/core";

export class LevelRewardService {
  private resolveReferenceRoleId(cfg: Awaited<ReturnType<typeof getGuildConfig>>): string | null {
    return cfg.levels.referenceRoleId ?? process.env.REFERENCE_ROLE_ID ?? null;
  }

  private resolveBotRoleId(cfg: Awaited<ReturnType<typeof getGuildConfig>>): string | null {
    return cfg.levels.botRoleId ?? process.env.BOT_ROLE_ID ?? null;
  }

  async apply(member: GuildMember, level: number): Promise<Role | null> {
    const cfg = await getGuildConfig(member.guild.id);
    if (cfg.levels.rewardRolesEnabled === false) return null;

    const me = member.guild.members.me;
    if (!me?.permissions.has("ManageRoles")) {
      logger.warn({ guildId: member.guild.id }, "LevelReward: ManageRoles manquant");
      return null;
    }

    const rewardLevel = getRewardLevel(level);
    if (rewardLevel === null) {
      await this.clearMemberRewardRoles(member);
      return null;
    }

    const role = await this.ensureRewardRole(member.guild, rewardLevel, cfg);
    if (!role) return null;

    const rewardRoles = member.guild.roles.cache.filter((r) => isLevelRewardRoleName(r.name));
    const toRemove = member.roles.cache.filter((r) => rewardRoles.has(r.id) && r.id !== role.id);

    try {
      if (toRemove.size > 0) {
        await member.roles.remove([...toRemove.values()], "Mise à jour rôle de niveau");
      }
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role, "Attribution automatique rôle de niveau");
      }
    } catch (err) {
      logger.warn({ err, guildId: member.guild.id, userId: member.id }, "LevelReward: attribution échouée");
      return null;
    }

    return role;
  }

  private async ensureRewardRole(
    guild: Guild,
    rewardLevel: number,
    cfg: Awaited<ReturnType<typeof getGuildConfig>>,
  ): Promise<Role | null> {
    const roleName = getRewardRoleName(rewardLevel);
    let role = guild.roles.cache.find((r) => r.name === roleName);

    if (!role) {
      try {
        role = await guild.roles.create({
          name: roleName,
          color: getRewardColour(rewardLevel),
          permissions: [],
          hoist: false,
          mentionable: false,
          reason: `Rôle récompense niveau ${rewardLevel}`,
        });
      } catch (err) {
        logger.warn({ err, guildId: guild.id, rewardLevel }, "LevelReward: création rôle échouée");
        return null;
      }
    }

    await this.positionRoleAboveReference(guild, role, cfg);
    return role;
  }

  private async positionRoleAboveReference(
    guild: Guild,
    role: Role,
    cfg: Awaited<ReturnType<typeof getGuildConfig>>,
  ): Promise<void> {
    const referenceRoleId = this.resolveReferenceRoleId(cfg);
    const botRoleId = this.resolveBotRoleId(cfg);
    if (!referenceRoleId || !botRoleId) return;

    const referenceRole = guild.roles.cache.get(referenceRoleId);
    const botRole = guild.roles.cache.get(botRoleId);
    if (!referenceRole || !botRole) return;

    const referencePos = referenceRole.position;
    const botRolePos = botRole.position;
    if (botRolePos <= referencePos + 1) return;

    const targetPosition = Math.min(botRolePos - 1, referencePos + 1);
    if (role.position === targetPosition) return;

    try {
      await role.setPosition(targetPosition, { reason: "Placement rôle récompense niveau" });
    } catch {
      // hiérarchie Discord — ignoré comme legacy
    }
  }

  private async clearMemberRewardRoles(member: GuildMember): Promise<void> {
    const rewardRoles = member.guild.roles.cache.filter((r) => isLevelRewardRoleName(r.name));
    const toRemove = member.roles.cache.filter((r) => rewardRoles.has(r.id));
    if (toRemove.size === 0) return;
    try {
      await member.roles.remove([...toRemove.values()], "Retrait rôles de niveau");
    } catch {
      // ignoré
    }
  }
}

export const levelRewardService = new LevelRewardService();
