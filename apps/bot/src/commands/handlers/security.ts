import type { ChatInputCommandInteraction } from "discord.js";
import { isLockdownActive, lockdownService } from "@sentinel/core";
import { getGuildConfig, prisma } from "@sentinel/database";
import { buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleSecurity(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const guild = interaction.guild!;

  if (sub === "status") {
    const cfg = await getGuildConfig(guildId);
    const row = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { lockdown: true },
    });
    const lock = (await isLockdownActive(guildId)) || Boolean(row?.lockdown);
    return {
      embeds: [
        buildSimpleEmbed(
          "État sécurité",
          `Lockdown : **${lock ? "oui" : "non"}**\nAnti-nuke : **${cfg.antiNuke.enabled ? "on" : "off"}**\nQuarantine : **${cfg.quarantineRoleId ? "rôle prêt" : "sera créé au besoin"}**`,
        ),
      ],
    };
  }

  if (sub === "whitelist_add") {
    const user = interaction.options.getUser("user", true);
    const level = interaction.options.getString("level", true) as "EXTRA_OWNER" | "TRUSTED";
    await prisma.whitelistEntry.upsert({
      where: { guildId_userId: { guildId, userId: user.id } },
      create: { guildId, userId: user.id, level, addedBy: interaction.user.id },
      update: { level, addedBy: interaction.user.id },
    });
    return { embeds: [successEmbed("Whitelist", `<@${user.id}> ajouté (**${level}**).`)] };
  }

  if (sub === "whitelist_remove") {
    const user = interaction.options.getUser("user", true);
    await prisma.whitelistEntry.deleteMany({ where: { guildId, userId: user.id } });
    return { embeds: [successEmbed("Whitelist", `<@${user.id}> retiré.`)] };
  }

  if (sub === "whitelist_list") {
    const entries = await prisma.whitelistEntry.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    const body =
      entries.length > 0
        ? entries.map((e) => `• <@${e.userId}> — **${e.level}**`).join("\n")
        : "Aucune entrée (le propriétaire du serveur est toujours whitelisté).";
    return { embeds: [buildSimpleEmbed("Whitelist anti-nuke", body)] };
  }

  if (sub === "lockdown") {
    await lockdownService.activate(guild, "Manuel");
    return { embeds: [successEmbed("Lockdown", "Lockdown activé.")] };
  }
  if (sub === "unlock") {
    await lockdownService.deactivate(guild);
    return { embeds: [successEmbed("Unlock", "Lockdown désactivé.")] };
  }

  throw new Error("Sous-commande inconnue.");
}
