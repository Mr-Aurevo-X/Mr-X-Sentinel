import { AuditLogEvent, type Client, type Guild } from "discord.js";
import { hasDangerousPermissions } from "@sentinel/shared";
import { getGuildConfig, isWhitelisted, prisma } from "@sentinel/database";
import { modLogService } from "../services/ModLogService.js";
import { shouldRunPermissionGuard } from "./featureGates.js";

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

  private async handle(
    entry: { executorId: string | null; targetId?: string | null; changes?: { key: string; new?: unknown }[] },
    guild: Guild,
  ): Promise<void> {
    if (!entry.executorId) return;

    const config = await getGuildConfig(guild.id);
    if (!shouldRunPermissionGuard(config.features)) return;

    const wl = await isWhitelisted(guild.id, entry.executorId, guild.ownerId);
    if (wl.whitelisted) return;

    for (const change of entry.changes ?? []) {
      if (change.key === "permissions" && change.new) {
        if (hasDangerousPermissions(String(change.new))) {
          await prisma.securityEvent.create({
            data: {
              guildId: guild.id,
              type: "DANGEROUS_PERMISSIONS",
              actorId: entry.executorId,
              targetId: entry.targetId ?? undefined,
              severity: "HIGH",
              metadata: { permissions: change.new },
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

          if (entry.targetId) {
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
    }
  }
}
