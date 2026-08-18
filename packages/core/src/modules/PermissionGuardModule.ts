import { AuditLogEvent, type Client, type Guild, type GuildAuditLogsEntry } from "discord.js";
import { hasDangerousPermissions } from "@sentinel/shared";
import { getGuildConfig, getGuildSetupComplete, isWhitelisted, prisma } from "@sentinel/database";
import { modLogService } from "../services/ModLogService.js";
import { isSecurityArmed, shouldRunPermissionGuard } from "./featureGates.js";

export class PermissionGuardModule {
  constructor(private client: Client) {}

  register(): void {
    this.client.on("guildAuditLogEntryCreate", (entry, guild) => {
      if (entry.action !== AuditLogEvent.RoleUpdate && entry.action !== AuditLogEvent.MemberRoleUpdate) {
        return;
      }
      void this.handle(entry, guild);
    });
  }

  private async handle(entry: GuildAuditLogsEntry, guild: Guild): Promise<void> {
    if (!entry.executorId) return;

    const config = await getGuildConfig(guild.id);
    if (!shouldRunPermissionGuard(config.features)) return;

    const wl = await isWhitelisted(guild.id, entry.executorId, guild.ownerId);
    if (wl.whitelisted) return;

    const setupComplete = await getGuildSetupComplete(guild.id);
    const armed = isSecurityArmed({
      setupComplete,
      monitorOnly: config.antiNuke.monitorOnly,
    });

    for (const change of entry.changes ?? []) {
      if (change.key !== "permissions" || !change.new) continue;
      if (!hasDangerousPermissions(String(change.new))) continue;

      await prisma.securityEvent.create({
        data: {
          guildId: guild.id,
          type: "DANGEROUS_PERMISSIONS",
          actorId: entry.executorId,
          targetId: entry.targetId ?? undefined,
          severity: "HIGH",
          metadata: { permissions: change.new, armed },
        },
      });

      await modLogService.logSecurity(this.client, guild.id, {
        title: "Permission Guard",
        description: "Permissions dangereuses accordées",
        severity: "HIGH",
        actorId: entry.executorId,
        fields: [
          { name: "Cible", value: entry.targetId ? `<@${entry.targetId}>` : "Rôle", inline: true },
        ],
      });

      if (!armed) continue;

      if (entry.action === AuditLogEvent.RoleUpdate && entry.targetId && change.old != null) {
        await this.revertRolePermissions(guild, entry.targetId, String(change.old));
        continue;
      }

      if (entry.action === AuditLogEvent.MemberRoleUpdate && entry.targetId) {
        const member = await guild.members.fetch(entry.targetId).catch(() => null);
        if (member) {
          const botMember = guild.members.me;
          const dangerous = member.roles.cache.filter((r) =>
            hasDangerousPermissions(r.permissions.bitfield.toString()),
          );
          if (botMember && dangerous.size > 0) {
            await member.roles
              .remove(
                dangerous.filter((r) => r.position < botMember.roles.highest.position),
                "Permission Guard",
              )
              .catch(() => undefined);
          }
        }
      }
    }
  }

  private async revertRolePermissions(guild: Guild, roleId: string, oldPermissions: string): Promise<void> {
    const role = guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId).catch(() => null));
    const botMember = guild.members.me;
    if (!role || !botMember || role.managed) return;
    if (role.position >= botMember.roles.highest.position) return;
    await role.setPermissions(BigInt(oldPermissions), "Permission Guard revert").catch(() => undefined);
  }
}
