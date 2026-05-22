import type { GuildMember } from "discord.js";
import { getGuildConfig } from "@sentinel/database";
import { logger } from "../logger.js";

export class QuarantineService {
  async quarantine(member: GuildMember, days = 7): Promise<boolean> {
    const config = await getGuildConfig(member.guild.id);
    const quarantineRoleId = config.quarantineRoleId;
    if (!quarantineRoleId) {
      logger.warn({ guildId: member.guild.id }, "No quarantine role configured");
      return false;
    }

    const quarantineRole = member.guild.roles.cache.get(quarantineRoleId);
    if (!quarantineRole) return false;

    const me = member.guild.members.me;
    if (!me || quarantineRole.position >= me.roles.highest.position) {
      return false;
    }

    const removable = member.roles.cache.filter(
      (r) => r.id !== member.guild.id && r.position < me.roles.highest.position && !r.managed,
    );

    try {
      await member.roles.set([quarantineRole], "mr-x-sentinel: Quarantine");
      const ms = days * 24 * 60 * 60 * 1000;
      await member.timeout(ms, "mr-x-sentinel: Threat quarantine");
      return true;
    } catch (err) {
      logger.error({ err, userId: member.id }, "Quarantine failed");
      try {
        if (removable.size > 0) {
          await member.roles.remove(removable, "mr-x-sentinel: Strip roles fallback");
        }
        await member.timeout(days * 86400000, "mr-x-sentinel: Quarantine fallback");
        return true;
      } catch {
        return false;
      }
    }
  }
}

export const quarantineService = new QuarantineService();
