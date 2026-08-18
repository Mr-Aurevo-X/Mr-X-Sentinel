import type { Guild } from "discord.js";
import { prisma } from "@sentinel/database";
import {
  CUSTOM_COMMAND_BODY_MAX,
  CUSTOM_COMMAND_DESC_MAX,
  CUSTOM_COMMAND_MAX_PER_GUILD,
  defaultCustomCommandDescription,
  validateCustomCommandName,
} from "@sentinel/shared";
import { logger } from "../../logger.js";

async function upsertGuildSlash(
  guild: Guild,
  name: string,
  description: string,
  knownId: string | null,
): Promise<string> {
  if (knownId) {
    try {
      const edited = await guild.commands.edit(knownId, { name, description });
      return edited.id;
    } catch {
      // stale Discord id — fall through
    }
  }
  const existing = await guild.commands.fetch();
  const found = existing.find((c) => c.name === name);
  if (found) {
    const edited = await found.edit({ description });
    return edited.id;
  }
  const created = await guild.commands.create({ name, description });
  return created.id;
}

export class CustomCommandService {
  async list(guildId: string) {
    return prisma.guildCustomCommand.findMany({
      where: { guildId },
      orderBy: { name: "asc" },
    });
  }

  async get(guildId: string, name: string) {
    return prisma.guildCustomCommand.findUnique({
      where: { guildId_name: { guildId, name } },
    });
  }

  async add(
    guild: Guild,
    createdBy: string,
    rawName: string,
    body: string,
    description: string | null,
    reservedNames: Iterable<string>,
  ) {
    const parsed = validateCustomCommandName(rawName, reservedNames);
    if (!parsed.ok) {
      if (parsed.reason === "reserved") {
        throw new Error("Ce nom est réservé par le bot.");
      }
      throw new Error("Nom invalide. Utilise a-z, 0-9, _ ou - (1-32), sans espace.");
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) throw new Error("Le texte ne peut pas être vide.");
    if (trimmedBody.length > CUSTOM_COMMAND_BODY_MAX) {
      throw new Error(`Le texte est limité à ${CUSTOM_COMMAND_BODY_MAX} caractères.`);
    }

    const desc = (description?.trim() || defaultCustomCommandDescription(trimmedBody)).slice(
      0,
      CUSTOM_COMMAND_DESC_MAX,
    );
    if (!desc) throw new Error("Description Discord invalide.");

    const existing = await this.get(guild.id, parsed.name);
    if (!existing) {
      const count = await prisma.guildCustomCommand.count({ where: { guildId: guild.id } });
      if (count >= CUSTOM_COMMAND_MAX_PER_GUILD) {
        throw new Error(`Limite atteinte : ${CUSTOM_COMMAND_MAX_PER_GUILD} commandes perso par serveur.`);
      }
    }

    const discordCommandId = await upsertGuildSlash(
      guild,
      parsed.name,
      desc,
      existing?.discordCommandId ?? null,
    );

    const row = await prisma.guildCustomCommand.upsert({
      where: { guildId_name: { guildId: guild.id, name: parsed.name } },
      create: {
        guildId: guild.id,
        name: parsed.name,
        body: trimmedBody,
        description: desc,
        createdBy,
        discordCommandId,
      },
      update: {
        body: trimmedBody,
        description: desc,
        discordCommandId,
      },
    });
    return { row, created: !existing };
  }

  async remove(guild: Guild, rawName: string): Promise<void> {
    const name = rawName.trim().toLowerCase();
    const row = await this.get(guild.id, name);
    if (!row) throw new Error("Commande perso introuvable.");

    try {
      if (row.discordCommandId) {
        await guild.commands.delete(row.discordCommandId);
      } else {
        const cmds = await guild.commands.fetch();
        const found = cmds.find((c) => c.name === name);
        if (found) await guild.commands.delete(found.id);
      }
    } catch (err) {
      logger.warn({ err, guildId: guild.id, name }, "custom command discord delete failed");
    }

    await prisma.guildCustomCommand.delete({ where: { id: row.id } });
  }

  async syncGuild(guild: Guild, reservedNames: Iterable<string>): Promise<void> {
    const rows = await this.list(guild.id);
    let existing;
    try {
      existing = await guild.commands.fetch();
    } catch (err) {
      logger.warn({ err, guildId: guild.id }, "custom command sync fetch failed");
      return;
    }

    const desired = new Set(rows.map((r) => r.name));
    const reserved = new Set([...reservedNames].map((n) => n.toLowerCase()));

    for (const row of rows) {
      const current =
        existing.find((c) => c.name === row.name) ??
        (row.discordCommandId ? existing.get(row.discordCommandId) : undefined);
      try {
        if (current) {
          if (current.description !== row.description || current.name !== row.name) {
            await current.edit({ name: row.name, description: row.description });
          }
          if (row.discordCommandId !== current.id) {
            await prisma.guildCustomCommand.update({
              where: { id: row.id },
              data: { discordCommandId: current.id },
            });
          }
        } else {
          const created = await guild.commands.create({
            name: row.name,
            description: row.description,
          });
          await prisma.guildCustomCommand.update({
            where: { id: row.id },
            data: { discordCommandId: created.id },
          });
        }
      } catch (err) {
        logger.warn({ err, guildId: guild.id, name: row.name }, "custom command sync upsert failed");
      }
    }

    // Fail-safe: without the reserved list we cannot tell bot commands apart
    // from stale customs, so never delete anything in that case.
    if (reserved.size === 0) {
      logger.warn({ guildId: guild.id }, "custom command sync: empty reserved list, skipping cleanup");
      return;
    }

    for (const cmd of existing.values()) {
      if (desired.has(cmd.name) || reserved.has(cmd.name)) continue;
      await guild.commands.delete(cmd.id).catch((err) => {
        logger.warn({ err, guildId: guild.id, name: cmd.name }, "custom command sync delete extra failed");
      });
    }
  }
}

export const customCommandService = new CustomCommandService();
