import type { GuildConfig } from "@sentinel/shared";
import type { AuditActionType, ThreatDecision, SecuritySeverity } from "@sentinel/shared";
import { DEFAULT_ANTI_NUKE } from "@sentinel/shared";
import { addThreatScore, incrementWindow } from "../redis.js";

export interface ThreatContext {
  guildId: string;
  actorId: string | null;
  action: AuditActionType;
  isWhitelisted: boolean;
  config: GuildConfig;
}

const ACTION_SCORES: Record<string, number> = {
  CHANNEL_DELETE: 50,
  ROLE_DELETE: 50,
  GUILD_UPDATE: 40,
  WEBHOOK_CREATE: 35,
  BOT_ADD: 45,
  BAN: 30,
  KICK: 20,
  CHANNEL_CREATE: 15,
  ROLE_CREATE: 15,
  ROLE_UPDATE: 20,
  CHANNEL_UPDATE: 10,
  MEMBER_ROLE_UPDATE: 25,
  EMOJI_DELETE: 15,
};

export class ThreatEngine {
  evaluate(ctx: ThreatContext): ThreatDecision {
    if (ctx.isWhitelisted) {
      return { actions: ["LOG"], severity: "LOW", reason: "Whitelisted actor", shouldRollback: false };
    }

    const antiNuke = { ...DEFAULT_ANTI_NUKE, ...ctx.config.antiNuke };
    if (!antiNuke.enabled) {
      return { actions: ["LOG"], severity: "LOW", reason: "Anti-nuke disabled", shouldRollback: false };
    }

    const instant = antiNuke.instantActions as readonly string[];
    if (instant.includes(ctx.action)) {
      return this.criticalDecision(ctx.action, "Instant protection triggered");
    }

    return { actions: ["LOG"], severity: "LOW", reason: "Below threshold", shouldRollback: false };
  }

  async evaluateWithThreshold(
    ctx: ThreatContext,
    thresholdKey: string,
  ): Promise<ThreatDecision> {
    const base = this.evaluate(ctx);
    if (ctx.isWhitelisted || base.severity === "CRITICAL") return base;

    const antiNuke = { ...DEFAULT_ANTI_NUKE, ...ctx.config.antiNuke };
    const threshold = antiNuke.thresholds[thresholdKey as keyof typeof antiNuke.thresholds];
    if (!threshold) return base;

    const key = `mrx:nuke:${ctx.guildId}:${ctx.actorId}:${thresholdKey}`;
    const count = await incrementWindow(key, threshold.windowSec);

    if (count >= threshold.count) {
      return this.criticalDecision(
        ctx.action,
        `Threshold exceeded: ${count}/${threshold.count} in ${threshold.windowSec}s`,
      );
    }

    return {
      actions: ["LOG"],
      severity: "MEDIUM",
      reason: `Action tracked (${count}/${threshold.count})`,
      shouldRollback: false,
    };
  }

  async recordThreat(guildId: string, userId: string, action: AuditActionType): Promise<number> {
    const delta = ACTION_SCORES[action] ?? 10;
    return addThreatScore(guildId, userId, delta);
  }

  private criticalDecision(action: AuditActionType, reason: string): ThreatDecision {
    const severity: SecuritySeverity = "CRITICAL";
    const shouldRollback = ["CHANNEL_DELETE", "ROLE_DELETE", "GUILD_UPDATE", "EMOJI_DELETE"].includes(
      action,
    );

    return {
      actions: shouldRollback
        ? ["QUARANTINE", "BAN", "ROLLBACK", "LOCKDOWN", "LOG"]
        : ["QUARANTINE", "BAN", "LOCKDOWN", "LOG"],
      severity,
      reason,
      shouldRollback,
    };
  }
}

export const threatEngine = new ThreatEngine();
