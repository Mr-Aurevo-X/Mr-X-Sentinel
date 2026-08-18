import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Guild, OverwriteResolvable } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import { ROLE_PRESET_PERMISSIONS } from "../../role-presets.js";
import { logProvisioningService } from "../../services/LogProvisioningService.js";
import type { Client } from "discord.js";
import { logService } from "../../services/LogService.js";

export type TemplateCategory = {
  name: string;
  text: string[];
  voice: string[];
  private_for: string[];
};

export type ServerTemplate = {
  key: string;
  label: string;
  description: string;
  roles: [string, string][];
  categories: TemplateCategory[];
};

const __dir = dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = join(__dir, "presets");

export function listTemplates(): ServerTemplate[] {
  const files = readdirSync(PRESETS_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  return files.map((f) => {
    const raw = JSON.parse(readFileSync(join(PRESETS_DIR, f), "utf-8")) as ServerTemplate;
    return raw;
  });
}

export class TemplateService {
  async apply(
    guild: Guild,
    templateKey: string,
    client: Client,
    actorId: string,
    options?: { createLogs?: boolean },
  ): Promise<ServerTemplate> {
    const path = join(PRESETS_DIR, `${templateKey}.json`);
    const template = JSON.parse(readFileSync(path, "utf-8")) as ServerTemplate;
    const roleMap = new Map<string, string>();

    for (const [displayName, presetKey] of template.roles) {
      const perms = ROLE_PRESET_PERMISSIONS[presetKey] ?? ROLE_PRESET_PERMISSIONS.member!;
      let role = guild.roles.cache.find((r) => r.name === displayName);
      if (!role) {
        role = await guild.roles.create({
          name: displayName,
          permissions: perms,
          reason: `Mr-X Sentinel template ${templateKey}`,
        });
      }
      roleMap.set(displayName, role.id);
    }

    const me = guild.members.me;
    if (!me) throw new Error("Bot introuvable sur le serveur.");

    for (const cat of template.categories) {
      const overwrites: OverwriteResolvable[] = [
        {
          id: me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
          ],
        },
      ];

      if (cat.private_for.length === 0) {
        overwrites.push({
          id: guild.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      } else {
        overwrites.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
        for (const roleName of cat.private_for) {
          const roleId = roleMap.get(roleName);
          if (roleId) {
            overwrites.push({
              id: roleId,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
              ],
            });
          }
        }
      }

      const category = await guild.channels.create({
        name: cat.name.slice(0, 100),
        type: ChannelType.GuildCategory,
        permissionOverwrites: overwrites,
        reason: `Template ${templateKey}`,
      });

      for (const textName of cat.text) {
        await guild.channels.create({
          name: textName.slice(0, 100),
          type: ChannelType.GuildText,
          parent: category.id,
          reason: `Template ${templateKey}`,
        });
      }
      for (const voiceName of cat.voice) {
        await guild.channels.create({
          name: voiceName.slice(0, 100),
          type: ChannelType.GuildVoice,
          parent: category.id,
          reason: `Template ${templateKey}`,
        });
      }
    }

    if (options?.createLogs !== false) {
      await logProvisioningService.provisionAll(guild, actorId);
    }

    await logService.log(client, guild.id, "admin", {
      title: "Template appliqué",
      description: `**${template.label}** (\`${templateKey}\`) par <@${actorId}>`,
      actorId,
    });

    return template;
  }

  async resetGuildStructure(
    guild: Guild,
    actorId: string,
  ): Promise<{ deletedChannels: number; deletedCategories: number; deletedRoles: number }> {
    const me = guild.members.me;
    if (!me) throw new Error("Bot introuvable sur le serveur.");
    if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new Error("Le bot doit avoir la permission Gérer les salons.");
    }
    if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      throw new Error("Le bot doit avoir la permission Gérer les rôles.");
    }

    let deletedChannels = 0;
    let deletedCategories = 0;
    let deletedRoles = 0;
    const reason = `Reset serveur demandé par ${actorId}`;

    for (const category of [...guild.channels.cache.values()].filter((c) => c.type === ChannelType.GuildCategory)) {
      for (const ch of [...category.children.cache.values()]) {
        try {
          await ch.delete(reason);
          deletedChannels += 1;
        } catch {
          /* skip protected */
        }
      }
      try {
        await category.delete(reason);
        deletedCategories += 1;
      } catch {
        /* skip */
      }
    }

    for (const ch of [...guild.channels.cache.values()]) {
      if (ch.type === ChannelType.GuildCategory) continue;
      if (ch.parentId) continue;
      try {
        await ch.delete(reason);
        deletedChannels += 1;
      } catch {
        /* skip */
      }
    }

    for (const role of [...guild.roles.cache.values()]) {
      if (role.id === guild.id || role.managed) continue;
      if (me.roles.highest.comparePositionTo(role) <= 0) continue;
      try {
        await role.delete(reason);
        deletedRoles += 1;
      } catch {
        /* skip */
      }
    }

    return { deletedChannels, deletedCategories, deletedRoles };
  }
}

export const templateService = new TemplateService();
