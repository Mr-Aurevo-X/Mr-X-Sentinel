import type { Client, GuildMember } from "discord.js";
import { DEFAULT_ANTI_RAID, REDIS_KEYS } from "@sentinel/shared";
import { getGuildConfig, prisma } from "@sentinel/database";
import { incrementWindow } from "../redis.js";
import { lockdownService } from "../services/LockdownService.js";
import { modLogService } from "../services/ModLogService.js";
import { quarantineService } from "../services/QuarantineService.js";

export class AntiRaidModule {
  constructor(private client: Client) {}

  register(): void {
    this.client.on("guildMemberAdd", (member) => {
      void this.handleJoin(member);
    });
  }

  private async handleJoin(member: GuildMember): Promise<void> {
    const config = await getGuildConfig(member.guild.id);
    const antiRaid = { ...DEFAULT_ANTI_RAID, ...config.antiRaid };
    if (!antiRaid.enabled) return;

    const joinCount = await incrementWindow(
      REDIS_KEYS.joinWindow(member.guild.id),
      antiRaid.joinWindowSec,
    );

    let suspicious = false;
    const reasons: string[] = [];

    const accountAgeMs = Date.now() - member.user.createdTimestamp;
    const minAgeMs = antiRaid.minAccountAgeDays * 86400000;
    if (accountAgeMs < minAgeMs) {
      suspicious = true;
      reasons.push("Compte trop récent");
    }

    if (antiRaid.requireAvatar && !member.user.avatar) {
      suspicious = true;
      reasons.push("Pas d'avatar");
    }

    const nameLower = member.user.username.toLowerCase();
    for (const pattern of antiRaid.suspiciousNamePatterns) {
      if (nameLower.includes(pattern.toLowerCase())) {
        suspicious = true;
        reasons.push(`Nom suspect: ${pattern}`);
        break;
      }
    }

    if (config.verification.enabled && config.verification.unverifiedRoleId) {
      const role = member.guild.roles.cache.get(config.verification.unverifiedRoleId);
      if (role) await member.roles.add(role).catch(() => undefined);
    }

    if (joinCount >= antiRaid.joinLimit) {
      await prisma.securityEvent.create({
        data: {
          guildId: member.guild.id,
          type: "RAID_JOIN",
          severity: "CRITICAL",
          metadata: { joinCount, limit: antiRaid.joinLimit },
        },
      });

      await modLogService.logSecurity(this.client, member.guild.id, {
        title: "Raid détecté",
        description: `${joinCount} joins en ${antiRaid.joinWindowSec}s`,
        severity: "CRITICAL",
      });

      if (antiRaid.autoLockdown) {
        await lockdownService.activate(member.guild, "Join raid detected");
      }
    }

    if (suspicious && joinCount >= Math.ceil(antiRaid.joinLimit / 2)) {
      await quarantineService.quarantine(member, 1);
      await prisma.securityEvent.create({
        data: {
          guildId: member.guild.id,
          type: "SUSPICIOUS_JOIN",
          actorId: member.id,
          severity: "HIGH",
          metadata: { reasons },
        },
      });
    }
  }
}
