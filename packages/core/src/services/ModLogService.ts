import type { Client, EmbedBuilder } from "discord.js";
import type { SecuritySeverity } from "@sentinel/shared";
import { logService } from "./LogService.js";

export class ModLogService {
  async logSecurity(
    client: Client,
    guildId: string,
    data: {
      title: string;
      description: string;
      severity: SecuritySeverity;
      actorId?: string | null;
      fields?: { name: string; value: string; inline?: boolean }[];
    },
  ): Promise<void> {
    await logService.log(client, guildId, "security", {
      title: data.title,
      description: data.description,
      severity: data.severity,
      actorId: data.actorId ?? undefined,
      fields: data.fields,
    });
  }

  async logModAction(client: Client, guildId: string, embed: EmbedBuilder): Promise<void> {
    await logService.logModAction(client, guildId, embed);
  }
}

export const modLogService = new ModLogService();
