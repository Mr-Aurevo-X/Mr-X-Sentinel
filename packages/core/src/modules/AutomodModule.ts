import type { Client, Message } from "discord.js";
import { DEFAULT_AUTOMOD } from "@sentinel/shared";
import { getGuildConfig, isWhitelisted, prisma } from "@sentinel/database";
import { incrementWindow, REDIS_KEYS } from "../redis.js";
import { modLogService } from "../services/ModLogService.js";
import { logService } from "../services/LogService.js";
import { capsRatio, hasDiscordInvite, hasZalgo } from "./automod/automodText.js";

const URL_REGEX = /https?:\/\/[^\s<]+/gi;

export class AutomodModule {
  constructor(private client: Client) {}

  register(): void {
    this.client.on("messageCreate", (msg) => {
      if (msg.author.bot || !msg.guild) return;
      void this.handleMessage(msg);
    });
  }

  private async handleMessage(message: Message): Promise<void> {
    const config = await getGuildConfig(message.guild!.id);
    const automod = { ...DEFAULT_AUTOMOD, ...config.automod };
    if (!automod.enabled) return;

    const wl = await isWhitelisted(
      message.guild!.id,
      message.author.id,
      message.guild!.ownerId,
    );
    if (wl.whitelisted) return;

    const violations: string[] = [];

    const accountAgeH = (Date.now() - message.author.createdTimestamp) / 3600000;
    if (automod.newAccountHours > 0 && accountAgeH < automod.newAccountHours) {
      violations.push("Compte récent");
    }

    const mentionCount =
      message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > automod.maxMentions) {
      violations.push(`Trop de mentions (${mentionCount})`);
    }

    if (automod.blockEveryone && message.mentions.everyone) {
      violations.push("@everyone interdit");
    }

    if (automod.blockInvites && hasDiscordInvite(message.content)) {
      const allowed = automod.allowedInviteGuilds.some((id) =>
        message.content.includes(id),
      );
      if (!allowed) violations.push("Invite non autorisée");
    }

    for (const word of automod.wordBlacklist) {
      if (word && message.content.toLowerCase().includes(word.toLowerCase())) {
        violations.push(`Mot interdit: ${word}`);
        break;
      }
    }

    if (automod.blockCaps && capsRatio(message.content) >= (automod.capsRatioLimit ?? 0.7)) {
      violations.push("Majuscules excessives");
    }

    if (automod.blockZalgo && hasZalgo(message.content)) {
      violations.push("Texte zalgo");
    }

    const urls = message.content.match(URL_REGEX) ?? [];
    for (const rawUrl of urls) {
      const lower = rawUrl.toLowerCase();
      if (automod.blockExternalUrls && !lower.includes("discord.com") && !lower.includes("discord.gg")) {
        violations.push("Lien externe");
        break;
      }
      for (const blocked of automod.blockedUrls ?? []) {
        if (blocked && lower.includes(blocked.toLowerCase())) {
          violations.push(`URL bloquée: ${blocked}`);
          break;
        }
      }
    }

    const msgKey = REDIS_KEYS.msgWindow(message.guild!.id, message.author.id);
    const msgCount = await incrementWindow(msgKey, 3);
    if (msgCount > automod.maxMessagesPerSec) {
      violations.push("Flood messages");
    }

    const dupKey = `mrx:dup:${message.guild!.id}:${message.author.id}:${message.content.slice(0, 80)}`;
    const dupCount = await incrementWindow(dupKey, automod.duplicateWindowSec);
    if (dupCount >= automod.maxDuplicateMessages) {
      violations.push("Messages dupliqués");
    }

    if (violations.length === 0) return;

    await logService.log(this.client, message.guild!.id, "automod", {
      title: "Automod",
      description: violations.join("\n"),
      actorId: message.author.id,
    });

    await message.delete().catch(() => undefined);

    await prisma.securityEvent.create({
      data: {
        guildId: message.guild!.id,
        type: "AUTOMOD",
        actorId: message.author.id,
        severity: "MEDIUM",
        metadata: { violations },
      },
    });

    const timeoutMs = violations.length >= 2 ? 3600000 : 600000;
    const member = message.member;
    if (member?.moderatable) {
      await member.timeout(timeoutMs, `Automod: ${violations.join(", ")}`).catch(() => undefined);
    }

    await modLogService.logSecurity(this.client, message.guild!.id, {
      title: "Automod",
      description: violations.join("\n"),
      severity: "MEDIUM",
      actorId: message.author.id,
    });
  }
}
