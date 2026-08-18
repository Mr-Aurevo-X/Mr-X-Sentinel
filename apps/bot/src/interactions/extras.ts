import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { customId } from "@sentinel/shared";
import { getGuildConfig, prisma, updateGuildConfig } from "@sentinel/database";
import { listTemplates, templateService } from "@sentinel/core";
import { musicManager } from "../music/MusicManager.js";
import { provisionWelcomeChannels, buildWelcomeSetupRows } from "../views/WelcomeSetupView.js";
import {
  buildTemplateApplySelect,
  buildTemplatePanelRows,
  buildTemplateResetConfirmRows,
} from "../views/TemplatePanelView.js";
import { buildAutomodPanelRows } from "../views/AutomodPanelView.js";
import { buildSimpleEmbed, errorEmbed, successEmbed, warningEmbed } from "../ui/embeds.js";
import type { ComponentHandler } from "./types.js";

export const handleAutomodComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  await interaction.deferUpdate();
  const cfg = await getGuildConfig(guild.id);
  const patch = { ...cfg.automod };
  if (parsed.action === "toggle") patch.enabled = !patch.enabled;
  if (parsed.action === "caps") patch.blockCaps = !patch.blockCaps;
  if (parsed.action === "zalgo") patch.blockZalgo = !patch.blockZalgo;
  if (parsed.action === "urls") patch.blockExternalUrls = !patch.blockExternalUrls;
  await updateGuildConfig(guild.id, { automod: patch });
  const am = (await getGuildConfig(guild.id)).automod;
  await interaction.editReply({
    embeds: [
      buildSimpleEmbed(
        "Automod mis à jour",
        `État **${am.enabled ? "ON" : "OFF"}** · Caps **${am.blockCaps}** · Zalgo **${am.blockZalgo}** · URLs **${am.blockExternalUrls}**`,
      ),
    ],
    components: buildAutomodPanelRows(am.enabled),
  });
};

export const handleWelcomeComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  if (parsed.action === "create") {
    await interaction.deferUpdate();
    const ids = await provisionWelcomeChannels(guild);
    const cfg = await getGuildConfig(guild.id);
    await updateGuildConfig(guild.id, { welcome: { ...cfg.welcome, ...ids } });
    await interaction.editReply({
      embeds: [successEmbed("Welcome setup", `Salons créés : <#${ids.welcomeChannelId}> · <#${ids.goodbyeChannelId}>`)],
      components: buildWelcomeSetupRows(),
    });
    return;
  }
  if (parsed.action === "info") {
    const cfg = await getGuildConfig(guild.id);
    await interaction.update({
      embeds: [
        buildSimpleEmbed(
          "Config welcome",
          `Bienvenue : ${cfg.welcome.welcomeChannelId ? `<#${cfg.welcome.welcomeChannelId}>` : "—"}\nDépart : ${cfg.welcome.goodbyeChannelId ? `<#${cfg.welcome.goodbyeChannelId}>` : "—"}\nAuto-role : ${cfg.welcome.autoRoleId ? `<@&${cfg.welcome.autoRoleId}>` : "—"}`,
        ),
      ],
      components: buildWelcomeSetupRows(),
    });
  }
};

export const handleLevelsComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  if (parsed.action !== "ping_toggle") return;
  if (parsed.extra !== interaction.user.id) {
    await interaction.reply({ embeds: [errorEmbed("Réservé", "Ton propre level-up.")], ephemeral: true });
    return;
  }
  const row = await prisma.userXp.findUnique({
    where: { guildId_userId: { guildId: guild.id, userId: interaction.user.id } },
  });
  const next = !(row?.levelUpPing ?? true);
  await prisma.userXp.upsert({
    where: { guildId_userId: { guildId: guild.id, userId: interaction.user.id } },
    create: { guildId: guild.id, userId: interaction.user.id, levelUpPing: next },
    update: { levelUpPing: next },
  });
  await interaction.reply({
    embeds: [successEmbed("Level-up", next ? "Ping activé." : "Ping désactivé.")],
    ephemeral: true,
  });
};

export const handleSuggestComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  if (parsed.action !== "up" && parsed.action !== "down") return;
  if (!interaction.isButton()) return;
  const messageId = parsed.extra;
  if (!messageId) return;
  await interaction.deferUpdate();
  const vote = parsed.action === "up" ? 1 : -1;
  await prisma.suggestionVote.upsert({
    where: {
      guildId_messageId_userId: {
        guildId: guild.id,
        messageId,
        userId: interaction.user.id,
      },
    },
    create: { guildId: guild.id, messageId, userId: interaction.user.id, vote },
    update: { vote },
  });
  const votes = await prisma.suggestionVote.findMany({ where: { guildId: guild.id, messageId } });
  const up = votes.filter((v: { vote: number }) => v.vote > 0).length;
  const down = votes.filter((v: { vote: number }) => v.vote < 0).length;
  await interaction.message.edit({
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(customId("suggest", "up", messageId))
          .setLabel(`👍 ${up}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(customId("suggest", "down", messageId))
          .setLabel(`👎 ${down}`)
          .setStyle(ButtonStyle.Danger),
      ),
    ],
  });
};

export const handleMusicComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  const guildIdMusic = parsed.extra ?? guild.id;
  const player = musicManager.getPlayer(guildIdMusic);
  if (!player) {
    await interaction.reply({ embeds: [errorEmbed("Musique", "Aucune lecture.")], ephemeral: true });
    return;
  }
  if (parsed.action === "pause") {
    player.pause(!player.paused);
    await interaction.reply({
      embeds: [successEmbed("Musique", player.paused ? "Pause." : "Reprise.")],
      ephemeral: true,
    });
    return;
  }
  if (parsed.action === "skip") {
    await player.skip();
    await interaction.reply({ embeds: [successEmbed("Musique", "Piste suivante.")], ephemeral: true });
    return;
  }
  if (parsed.action === "stop") {
    player.destroy();
    await interaction.reply({ embeds: [successEmbed("Musique", "Arrêté.")], ephemeral: true });
    return;
  }
  if (parsed.action === "queue") {
    const q = player.queue.map((t) => t.title).slice(0, 10).join("\n") || "(vide)";
    await interaction.reply({ embeds: [buildSimpleEmbed("File d'attente", q)], ephemeral: true });
    return;
  }
  if (parsed.action === "shuffle") {
    const n = musicManager.shuffle(guildIdMusic);
    await interaction.reply({
      embeds: [successEmbed("Shuffle", `File mélangée (**${n}**).`)],
      ephemeral: true,
    });
  }
};

export const handleTemplateComponent: ComponentHandler = async ({ interaction, client, guild, parsed }) => {
  if (parsed.action === "list") {
    const templates = listTemplates();
    const body = templates.map((t) => `• **${t.label}** (\`${t.key}\`) — ${t.description}`).join("\n") || "Aucun template.";
    await interaction.update({
      embeds: [buildSimpleEmbed("📚 Templates disponibles", body, 0x5865f2)],
      components: buildTemplatePanelRows(),
    });
    return;
  }

  if (parsed.action === "apply_menu") {
    await interaction.update({
      embeds: [buildSimpleEmbed("🧩 Appliquer un template", "Choisis un modèle dans le menu ci-dessous.", 0x57f287)],
      components: [buildTemplateApplySelect(), ...buildTemplatePanelRows()],
    });
    return;
  }

  if (parsed.action === "reset_warn") {
    await interaction.update({
      embeds: [
        warningEmbed(
          "Reset complet",
          "⚠️ **Action destructive** — supprime salons, catégories et rôles (sauf @everyone et rôles gérés).\n\nConfirme pour continuer.",
        ),
      ],
      components: buildTemplateResetConfirmRows(),
    });
    return;
  }

  if (parsed.action === "reset_cancel") {
    const count = listTemplates().length;
    await interaction.update({
      embeds: [
        buildSimpleEmbed(
          "🧩 Panneau templates",
          `**${count}** modèles disponibles.\n\n• **Appliquer** — crée rôles, catégories et salons\n• **Reset complet** — repartir de zéro (destructif)`,
          0x5865f2,
        ),
      ],
      components: buildTemplatePanelRows(),
    });
    return;
  }

  if (parsed.action === "reset_confirm") {
    await interaction.deferUpdate();
    const result = await templateService.resetGuildStructure(guild, interaction.user.id);
    const embed = warningEmbed("Reset terminé", "Nettoyage complet du serveur exécuté.");
    embed.addFields(
      { name: "Salons supprimés", value: String(result.deletedChannels), inline: true },
      { name: "Catégories supprimées", value: String(result.deletedCategories), inline: true },
      { name: "Rôles supprimés", value: String(result.deletedRoles), inline: true },
    );
    await interaction.editReply({ embeds: [embed], components: buildTemplatePanelRows() });
    return;
  }

  if (parsed.action === "apply" && interaction.isStringSelectMenu()) {
    await interaction.deferUpdate();
    const templateKey = interaction.values[0]!;
    const template = await templateService.apply(guild, templateKey, client, interaction.user.id, {
      createLogs: false,
    });
    await interaction.editReply({
      embeds: [
        successEmbed(
          "Template appliqué",
          `**${template.label}** (\`${templateKey}\`) a été appliqué.\nUtilise \`/logs create\` si tu veux les salons logs.`,
        ),
      ],
      components: buildTemplatePanelRows(),
    });
  }
};

export const handleVerifyComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  if (parsed.action !== "ok" || !interaction.isButton()) return;
  const cfg = await getGuildConfig(guild.id);
  if (!cfg.verification.enabled || !cfg.verification.verifiedRoleId) {
    await interaction.reply({ embeds: [errorEmbed("Vérification", "Non configurée.")], ephemeral: true });
    return;
  }
  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member) return;
  await interaction.deferReply({ ephemeral: true });
  const added = await member.roles
    .add(cfg.verification.verifiedRoleId)
    .then(() => true)
    .catch(() => false);
  if (!added) {
    await interaction.editReply({
      embeds: [errorEmbed("Vérification", "Impossible d'ajouter le rôle (hiérarchie ou permissions).")],
    });
    return;
  }
  if (cfg.verification.unverifiedRoleId) {
    await member.roles.remove(cfg.verification.unverifiedRoleId).catch(() => undefined);
  }
  await interaction.editReply({ embeds: [successEmbed("Vérifié", "Accès accordé.")] });
};
