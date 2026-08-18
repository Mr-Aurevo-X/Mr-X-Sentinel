import type { ChatInputCommandInteraction } from "discord.js";
import { levelsService } from "@sentinel/core";
import { getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { buildRankEmbed, buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleLevels(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  if (sub === "roles") return handleLevelsRoles(interaction);
  if (sub === "channel") return handleSetLevelChannel(interaction);
  if (sub === "channel_off") return handleRemoveLevelChannel(interaction);
  if (sub === "info") return handleLevelsInfo(interaction);
  throw new Error("Sous-commande inconnue.");
}

export async function handleLevelsRoles(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const cfg = await getGuildConfig(interaction.guild!.id);
  const ref = interaction.options.getRole("reference_role");
  const botRole = interaction.options.getRole("bot_role");
  await updateGuildConfig(interaction.guild!.id, {
    levels: {
      ...cfg.levels,
      ...(ref ? { referenceRoleId: ref.id } : {}),
      ...(botRole ? { botRoleId: botRole.id } : {}),
    },
  });
  return {
    embeds: [
      successEmbed(
        "Rôles niveaux",
        `Référence : ${ref ? ref.name : "—"} · Bot : ${botRole ? botRole.name : "—"}`,
      ),
    ],
  };
}

export async function handleRank(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const member = interaction.member as import("discord.js").GuildMember;
  const row = await levelsService.getOrCreate(interaction.guild!.id, interaction.user.id);
  const { currentLevelXp, nextLevelXp } = levelsService.getProgress(row.xp, row.level);
  return {
    embeds: [
      buildRankEmbed(
        member.displayName ?? interaction.user.username,
        member.displayAvatarURL(),
        row.level,
        row.xp,
        nextLevelXp,
        currentLevelXp,
      ),
    ],
  };
}

export async function handleSetLevelChannel(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const channel = interaction.options.getChannel("channel", true);
  const cfg = await getGuildConfig(interaction.guild!.id);
  await updateGuildConfig(interaction.guild!.id, {
    levels: { ...cfg.levels, levelUpChannelId: channel.id },
  });
  return {
    embeds: [
      buildSimpleEmbed(
        "Salon level up défini",
        `Les annonces seront envoyées dans <#${channel.id}>.`,
        0x57f287,
      ),
    ],
  };
}

export async function handleRemoveLevelChannel(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const cfg = await getGuildConfig(interaction.guild!.id);
  await updateGuildConfig(interaction.guild!.id, {
    levels: { ...cfg.levels, levelUpChannelId: null },
  });
  return {
    embeds: [buildSimpleEmbed("Salon level up retiré", "Les annonces iront dans les logs levels.", 0xfee75c)],
  };
}

export async function handleLevelsInfo(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const cfg = await getGuildConfig(interaction.guild!.id);
  const ch = cfg.levels.levelUpChannelId ? `<#${cfg.levels.levelUpChannelId}>` : "*(salon par défaut / logs)*";
  const ref = cfg.levels.referenceRoleId ?? process.env.REFERENCE_ROLE_ID ?? "—";
  const botRole = cfg.levels.botRoleId ?? process.env.BOT_ROLE_ID ?? "—";
  const rewards = cfg.levels.rewardRolesEnabled !== false ? "activés" : "désactivés";
  return {
    embeds: [
      buildSimpleEmbed(
        "Configuration niveaux",
        [
          `Salon level-up : ${ch}`,
          `Rôles auto : **${rewards}**`,
          `Rôle référence : ${ref === "—" ? "—" : `<@&${ref}>`}`,
          `Rôle bot (hiérarchie) : ${botRole === "—" ? "—" : `<@&${botRole}>`}`,
          "",
          "Paliers : 10, 20… 100, 200… 1000… et **Transcendant** (10 000).",
          "Le bot crée les rôles à chaque palier et les assigne automatiquement.",
        ].join("\n"),
        0x5865f2,
      ),
    ],
  };
}

export async function handleLvlInfo(): Promise<CommandReply> {
  return {
    embeds: [
      buildSimpleEmbed(
        "📘 Système de niveaux",
        [
          "Chaque message valide donne **5–10 XP** (cooldown 60 s).",
          "**Streak quotidien** : multiplicateur jusqu'à ×3+ si tu parles chaque jour.",
          "**Bonus travail** : ×2 XP pendant 24 h après `/work`.",
          "**Rôles auto** : créés et assignés aux paliers 10, 20, 100, 1000…",
          "",
          "**Commandes :** `/rank` · `/levels channel` · `/levels info`",
        ].join("\n"),
        0xf1c40f,
      ),
    ],
  };
}
