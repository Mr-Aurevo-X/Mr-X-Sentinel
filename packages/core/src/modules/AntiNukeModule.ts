import {
  AuditLogEvent,
  type Client,
  type Guild,
  type GuildAuditLogsEntry,
} from "discord.js";
import type { AuditActionType } from "@sentinel/shared";
import { isWhitelisted, getGuildConfig, prisma } from "@sentinel/database";
import { threatEngine } from "../engine/ThreatEngine.js";
import { quarantineService } from "../services/QuarantineService.js";
import { lockdownService } from "../services/LockdownService.js";
import { modLogService } from "../services/ModLogService.js";
import { enqueueRestore } from "../queue/restoreQueue.js";
import { snapshotService } from "../services/SnapshotService.js";
import { logger } from "../logger.js";

const AUDIT_MAP: Partial<Record<AuditLogEvent, AuditActionType>> = {
  [AuditLogEvent.MemberBanAdd]: "BAN",
  [AuditLogEvent.MemberKick]: "KICK",
  [AuditLogEvent.ChannelCreate]: "CHANNEL_CREATE",
  [AuditLogEvent.ChannelDelete]: "CHANNEL_DELETE",
  [AuditLogEvent.ChannelUpdate]: "CHANNEL_UPDATE",
  [AuditLogEvent.RoleCreate]: "ROLE_CREATE",
  [AuditLogEvent.RoleDelete]: "ROLE_DELETE",
  [AuditLogEvent.RoleUpdate]: "ROLE_UPDATE",
  [AuditLogEvent.GuildUpdate]: "GUILD_UPDATE",
  [AuditLogEvent.WebhookCreate]: "WEBHOOK_CREATE",
  [AuditLogEvent.WebhookDelete]: "WEBHOOK_DELETE",
  [AuditLogEvent.BotAdd]: "BOT_ADD",
  [AuditLogEvent.MemberRoleUpdate]: "MEMBER_ROLE_UPDATE",
  [AuditLogEvent.EmojiDelete]: "EMOJI_DELETE",
};

export class AntiNukeModule {
  constructor(private client: Client) {}

  register(): void {
    this.client.on("guildAuditLogEntryCreate", (entry, guild) => {
      void this.handleAuditEntry(entry, guild);
    });
  }

  private async handleAuditEntry(entry: GuildAuditLogsEntry, guild: Guild): Promise<void> {
    const action = AUDIT_MAP[entry.action];
    if (!action) return;

    const actorId = entry.executorId;
    const config = await getGuildConfig(guild.id);
    if (!config.antiNuke.enabled) return;

    const ownerId = guild.ownerId;
    const wl = actorId
      ? await isWhitelisted(guild.id, actorId, ownerId)
      : { whitelisted: false, level: null };

    const isGhost = !actorId;
    const ctx = {
      guildId: guild.id,
      actorId,
      action,
      isWhitelisted: wl.whitelisted,
      config,
    };

    let decision = threatEngine.evaluate(ctx);
    const thresholdKey = action;
    if (!wl.whitelisted && !config.antiNuke.monitorOnly) {
      decision = await threatEngine.evaluateWithThreshold(ctx, thresholdKey);
    }

    if (isGhost && !wl.whitelisted) {
      decision = {
        actions: ["QUARANTINE", "LOCKDOWN", "LOG"],
        severity: "CRITICAL",
        reason: "Ghost event — unknown executor",
        shouldRollback: true,
      };
    }

    await prisma.securityEvent.create({
      data: {
        guildId: guild.id,
        type: `ANTI_NUKE_${action}`,
        actorId,
        severity: decision.severity,
        metadata: { reason: decision.reason, actions: decision.actions },
      },
    });

    if (actorId) await threatEngine.recordThreat(guild.id, actorId, action);

    await modLogService.logSecurity(this.client, guild.id, {
      title: "Anti-Nuke Detection",
      description: decision.reason,
      severity: decision.severity,
      actorId,
      fields: [{ name: "Action", value: action, inline: true }],
    });

    if (config.antiNuke.monitorOnly) return;

    if (decision.actions.includes("LOCKDOWN") && config.antiNuke.autoLockdown) {
      await lockdownService.activate(guild, decision.reason);
    }

    if (decision.shouldRollback) {
      const latest = await snapshotService.getLatest(guild.id);
      if (latest) {
        const snaps = await prisma.snapshot.findFirst({
          where: { guildId: guild.id },
          orderBy: { createdAt: "desc" },
        });
        if (snaps) await enqueueRestore(guild.id, snaps.id);
      }
    }

    if (actorId && decision.actions.includes("QUARANTINE")) {
      const member = await guild.members.fetch(actorId).catch(() => null);
      if (member) {
        await quarantineService.quarantine(member, config.antiNuke.quarantineDays);
      }
    }

    if (actorId && decision.actions.includes("BAN")) {
      await guild.members.ban(actorId, { reason: `mr-x-sentinel: ${decision.reason}` }).catch((err) => {
        logger.warn({ err, actorId }, "Ban failed");
      });
    }

    if (action === "WEBHOOK_CREATE" || action === "WEBHOOK_DELETE") {
      await this.purgeWebhooks(guild);
    }

    if (action === "GUILD_UPDATE" && entry.changes) {
      await this.revertGuildUpdate(guild, entry);
    }
  }

  private async purgeWebhooks(guild: Guild): Promise<void> {
    const channels = guild.channels.cache.filter((c) => c.isTextBased());
    for (const ch of channels.values()) {
      if (!("fetchWebhooks" in ch)) continue;
      const hooks = await ch.fetchWebhooks().catch(() => null);
      if (!hooks) continue;
      for (const hook of hooks.values()) {
        await hook.delete("mr-x-sentinel: Anti-nuke").catch(() => undefined);
      }
    }
  }

  private async revertGuildUpdate(guild: Guild, entry: GuildAuditLogsEntry): Promise<void> {
    for (const change of entry.changes ?? []) {
      if (change.key === "name" && change.old) {
        await guild.setName(String(change.old), "mr-x-sentinel: Revert").catch(() => undefined);
      }
      if (change.key === "icon_hash" && change.old === null) {
        await guild.setIcon(null, "mr-x-sentinel: Revert").catch(() => undefined);
      }
    }
  }
}
