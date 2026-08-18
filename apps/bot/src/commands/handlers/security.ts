import type { ChatInputCommandInteraction } from "discord.js";
import { isLockdownActive, isSecurityArmed, lockdownService, logService, shouldRunAntiNuke } from "@sentinel/core";
import { getGuildConfig, getGuildSetupComplete, prisma, updateGuildConfig } from "@sentinel/database";
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
      select: { lockdown: true, setupComplete: true, quarantineRoleId: true },
    });
    const lock = (await isLockdownActive(guildId)) || Boolean(row?.lockdown);
    const armed =
      shouldRunAntiNuke(cfg.features, cfg.antiNuke.enabled) &&
      isSecurityArmed({
        setupComplete: Boolean(row?.setupComplete),
        monitorOnly: cfg.antiNuke.monitorOnly,
      });
    return {
      embeds: [
        buildSimpleEmbed(
          "État sécurité",
          [
            `Setup : **${row?.setupComplete ? "terminé" : "à faire (`/setup`)"}**`,
            `Mode : **${armed ? "armé" : "surveillance seule"}**`,
            `Lockdown : **${lock ? "oui" : "non"}**`,
            `Anti-nuke : **${cfg.antiNuke.enabled ? "on" : "off"}**`,
            `Quarantine : **${row?.quarantineRoleId ? "rôle prêt" : "sera créé au besoin"}**`,
          ].join("\n"),
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
  if (sub === "arm") {
    if (!(await getGuildSetupComplete(guildId))) {
      throw new Error("Termine `/setup` avant d'armer la sécurité.");
    }
    const cfg = await getGuildConfig(guildId);
    await updateGuildConfig(guildId, { antiNuke: { ...cfg.antiNuke, monitorOnly: false } });
    await logService.log(interaction.client, guildId, "admin", {
      title: "Sécurité armée",
      description: `Anti-nuke armé par <@${interaction.user.id}>`,
      actorId: interaction.user.id,
    });
    return {
      embeds: [
        successEmbed(
          "Sécurité armée",
          "Lockdown, quarantine et restore repair sont actifs. Whiteliste le staff avec `/security whitelist_add`. `/security disarm` pour revenir en surveillance.",
        ),
      ],
    };
  }
  if (sub === "disarm") {
    const cfg = await getGuildConfig(guildId);
    await updateGuildConfig(guildId, { antiNuke: { ...cfg.antiNuke, monitorOnly: true } });
    await logService.log(interaction.client, guildId, "admin", {
      title: "Sécurité en surveillance",
      description: `Anti-nuke désarmé par <@${interaction.user.id}>`,
      actorId: interaction.user.id,
    });
    return {
      embeds: [successEmbed("Surveillance seule", "Les événements sont loggés, sans lockdown ni rollback automatique.")],
    };
  }

  throw new Error("Sous-commande inconnue.");
}
