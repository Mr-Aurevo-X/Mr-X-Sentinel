import type { Client, ColorResolvable, EmbedBuilder } from "discord.js";
import { EmbedBuilder as Embed } from "discord.js";
import { prisma, getGuildConfig } from "@sentinel/database";
import type { LogType, SecuritySeverity } from "@sentinel/shared";
import { BRAND_COLOR } from "@sentinel/shared";
import { logger } from "../logger.js";

const SEVERITY_COLORS: Record<SecuritySeverity, ColorResolvable> = {
  LOW: 0x57f287,
  MEDIUM: 0xfee75c,
  HIGH: 0xed4245,
  CRITICAL: 0x9b59b6,
};

const LOG_COLORS: Partial<Record<LogType, ColorResolvable>> = {
  moderation: 0xe67e22,
  security: 0x9b59b6,
  automod: 0xf1c40f,
  brain: 0x3498db,
  economy: 0x2ecc71,
  levels: 0x1abc9c,
  admin: 0x95a5a6,
  join_leave: 0x57f287,
  message: 0x7289da,
  tickets: 0xe91e63,
};

export type LogPayload = {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  color?: ColorResolvable;
  actorId?: string;
  severity?: SecuritySeverity;
};

export class LogService {
  async resolveChannelId(guildId: string, logType: LogType): Promise<string | null> {
    const row = await prisma.guildLogChannel.findUnique({
      where: { guildId_logType: { guildId, logType } },
    });
    if (row) return row.channelId;

    const config = await getGuildConfig(guildId);
    if (logType === "moderation" || logType === "security") {
      return config.modLogChannelId;
    }
    return null;
  }

  async log(client: Client, guildId: string, logType: LogType, data: LogPayload): Promise<void> {
    const channelId = await this.resolveChannelId(guildId, logType);
    if (!channelId) {
      logger.debug({ guildId, logType }, "log channel not configured");
      return;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased() || !("send" in channel)) return;

    const color =
      data.color ??
      (data.severity ? SEVERITY_COLORS[data.severity] : LOG_COLORS[logType]) ??
      BRAND_COLOR;

    const embed = new Embed()
      .setColor(color)
      .setTitle(data.title)
      .setTimestamp()
      .setFooter({ text: "Mr-X Sentinel" });

    if (data.description) embed.setDescription(data.description);
    if (data.actorId) {
      embed.addFields({ name: "Acteur", value: `<@${data.actorId}>`, inline: true });
    }
    if (data.fields) embed.addFields(data.fields);

    await channel.send({ embeds: [embed] }).catch(() => undefined);

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (
      guild?.alertWebhookUrl &&
      data.severity === "CRITICAL" &&
      logType === "security"
    ) {
      await fetch(guild.alertWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{ title: data.title, description: data.description, color: 0x9b59b6 }],
        }),
      }).catch(() => undefined);
    }
  }

  async logModAction(client: Client, guildId: string, embed: EmbedBuilder): Promise<void> {
    const channelId = await this.resolveChannelId(guildId, "moderation");
    if (!channelId) return;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased() || !("send" in channel)) return;
    await channel.send({ embeds: [embed.setColor(BRAND_COLOR).setFooter({ text: "Mr-X Sentinel" })] }).catch(() => undefined);
  }
}

export const logService = new LogService();
