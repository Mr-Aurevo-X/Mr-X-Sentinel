import type { Interaction, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { EmbedBuilder } from "discord.js";
import {
  lockdownService,
  snapshotService,
  enqueueRestore,
  isLockdownActive,
  logProvisioningService,
  logService,
  levelsService,
  type ModerationService,
} from "@sentinel/core";
import { prisma, getGuildConfig } from "@sentinel/database";
import { BRAND_COLOR } from "@sentinel/shared";
import { chatCompletion, resetConversation } from "@sentinel/ai";
import { buildFonctionnementEmbed, buildFonctionnementView } from "./fonctionnement.js";
import { buildSentinelHub, handleComponent } from "../interaction-router.js";

export async function handleInteraction(
  interaction: Interaction,
  moderation: ModerationService,
  client: import("discord.js").Client,
): Promise<void> {
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await handleComponent(interaction, client, moderation);
    return;
  }

  if (!interaction.isChatInputCommand() || !interaction.guild) return;

  try {
    const name = interaction.commandName;

    if (name === "setup") await handleSetup(interaction, client);
    else if (name === "fonctionnement") await handleFonctionnement(interaction);
    else if (name === "logs") await handleLogs(interaction);
    else if (name === "sentinel") await handleSentinel(interaction);
    else if (name === "panel") await handlePanel(interaction);
    else if (name === "security") await handleSecurity(interaction);
    else if (name === "backup") await handleBackup(interaction);
    else if (name === "help") await handleHelp(interaction);
    else if (name === "rank") await handleRank(interaction);
    else if (name === "chat") await handleChat(interaction);
    else if (name === "play") await handlePlay(interaction);
    else if (name === "ban") await handleBan(interaction, moderation);
    else if (name === "unban") await handleUnban(interaction);
    else if (name === "kick") await handleKick(interaction, moderation);
    else if (name === "mute") await handleMute(interaction, moderation);
    else if (name === "unmute") await handleUnmute(interaction);
    else if (name === "warn") await handleWarn(interaction, moderation);
    else if (name === "warnings") await handleWarnings(interaction);
    else if (name === "clear") await handleClear(interaction);
    else if (name === "nuke") await handleNuke(interaction);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `❌ ${msg}`, ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ ${msg}`, ephemeral: true });
    }
  }
}

async function handleSetup(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
) {
  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild!;
  const createLogs = interaction.options.getBoolean("create_logs") ?? true;

  let quarantineRole = guild.roles.cache.find((r) => r.name === "Quarantine");
  if (!quarantineRole) {
    quarantineRole = await guild.roles.create({
      name: "Quarantine",
      color: 0x2f3136,
      permissions: [],
      reason: "Mr-X Sentinel setup",
    });
  }

  if (createLogs) {
    await logProvisioningService.provisionAll(guild, interaction.user.id);
  }

  await prisma.guild.update({
    where: { id: guild.id },
    data: {
      quarantineRoleId: quarantineRole.id,
      setupComplete: true,
    },
  });

  await logService.log(client, guild.id, "admin", {
    title: "Setup terminé",
    description: `Configuré par <@${interaction.user.id}>`,
    actorId: interaction.user.id,
  });

  await interaction.editReply({
    content:
      "Setup Mr-X Sentinel terminé." +
      (createLogs ? " Salons logs créés." : "") +
      " Lance **/fonctionnement** (owner) pour le guide complet.",
  });
}

async function handleFonctionnement(interaction: ChatInputCommandInteraction) {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    await interaction.reply({
      content: "Cette commande est réservée au **propriétaire** du serveur.",
      ephemeral: true,
    });
    return;
  }
  const features = (await getGuildConfig(interaction.guild!.id)).features;
  const isPublic = interaction.options.getBoolean("public") ?? false;
  const embed = buildFonctionnementEmbed(features);
  const components = buildFonctionnementView(features);
  if (isPublic) {
    await interaction.reply({ embeds: [embed], components });
  } else {
    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  }
}

async function handleLogs(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub === "create") {
    await interaction.deferReply({ ephemeral: true });
    const channels = await logProvisioningService.provisionAll(interaction.guild!);
    await interaction.editReply({
      content: `${Object.keys(channels).length} salons de logs configurés.`,
    });
    return;
  }
  await interaction.reply({
    content: "Utilise **/logs create** ou le bouton dans **/fonctionnement**.",
    ephemeral: true,
  });
}

async function handleSentinel(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Mr-X Sentinel")
    .setDescription("Hub communautaire — économie, XP, et plus.");
  await interaction.reply({ embeds: [embed], components: buildSentinelHub(), ephemeral: true });
}

async function handlePanel(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Panel staff")
    .setDescription(
      "Modération : `/ban` `/kick` `/mute` `/warn` `/clear`\nSécurité : `/security`\nLogs : `/logs create`",
    );
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSecurity(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "status") {
    const cfg = await getGuildConfig(guildId);
    await interaction.reply({
      content: `Lockdown: ${(await isLockdownActive(guildId)) ? "oui" : "non"} | Anti-nuke: ${cfg.antiNuke.enabled ? "on" : "off"}`,
      ephemeral: true,
    });
  } else if (sub === "lockdown") {
    await lockdownService.activate(interaction.guild!, "Manuel");
    await interaction.reply({ content: "Lockdown activé.", ephemeral: true });
  } else if (sub === "unlock") {
    await lockdownService.deactivate(interaction.guild!);
    await interaction.reply({ content: "Lockdown désactivé.", ephemeral: true });
  }
}

async function handleBackup(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;
  if (sub === "create") {
    await interaction.deferReply({ ephemeral: true });
    const snapId = await snapshotService.capture(guild, "manual");
    await interaction.editReply({ content: `Snapshot créé : \`${snapId}\`` });
  } else if (sub === "list") {
    const snaps = await prisma.snapshot.findMany({
      where: { guildId: guild.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    await interaction.reply({
      content: snaps.length
        ? snaps.map((s) => `\`${s.id}\` — ${s.label} (${s.createdAt.toISOString()})`).join("\n")
        : "Aucun snapshot.",
      ephemeral: true,
    });
  } else if (sub === "restore") {
    const id = interaction.options.getString("id", true);
    await enqueueRestore(guild.id, id);
    await interaction.reply({ content: `Restauration planifiée pour \`${id}\`.`, ephemeral: true });
  }
}

async function handleHelp(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Aide Mr-X Sentinel")
    .setDescription(
      "Membres : `/sentinel menu` `/rank` `/play` `/chat`\nStaff : `/ban` `/kick` … `/panel`\nOwner : `/setup` `/fonctionnement` `/logs`",
    );
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleRank(interaction: ChatInputCommandInteraction) {
  const xp = await levelsService.getOrCreate(interaction.guild!.id, interaction.user.id);
  await interaction.reply({
    content: `Niveau **${xp.level}** — **${xp.xp}** XP`,
    ephemeral: true,
  });
}

async function handleChat(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub === "reset") {
    await resetConversation(interaction.user.id, interaction.guild!.id);
    await interaction.reply({ content: "Conversation réinitialisée.", ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  const prompt = interaction.options.getString("prompt", true);
  const reply = await chatCompletion(interaction.user.id, interaction.guild!.id, prompt);
  await interaction.editReply({ content: reply.slice(0, 2000) });
}

async function handlePlay(interaction: ChatInputCommandInteraction) {
  const q = interaction.options.getString("query", true);
  await interaction.reply({
    content: `Musique (Lavalink) : recherche \`${q}\` — assure-toi que le service Lavalink tourne (docker compose).`,
    ephemeral: true,
  });
}

async function handleBan(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await interaction.deferReply({ ephemeral: true });
  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", true);
  const days = interaction.options.getInteger("delete_days") ?? 1;
  await mod.ban(interaction.guild!.id, user.id, interaction.user, reason, days);
  await interaction.editReply({ content: `${user.tag} banni.` });
}

async function handleUnban(interaction: ChatInputCommandInteraction) {
  const userId = interaction.options.getString("user_id", true);
  await interaction.guild!.members.unban(userId).catch(() => undefined);
  await interaction.reply({ content: `Unban ${userId}`, ephemeral: true });
}

async function handleKick(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await interaction.deferReply({ ephemeral: true });
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const reason = interaction.options.getString("reason", true);
  await mod.kick(member, interaction.user, reason);
  await interaction.editReply({ content: `${member.user.tag} expulsé.` });
}

async function handleMute(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await interaction.deferReply({ ephemeral: true });
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const reason = interaction.options.getString("reason", true);
  const minutes = interaction.options.getInteger("minutes", true);
  await mod.mute(member, interaction.user, reason, minutes * 60_000);
  await interaction.editReply({ content: `${member.user.tag} mute ${minutes} min.` });
}

async function handleUnmute(interaction: ChatInputCommandInteraction) {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  await member.timeout(null);
  await interaction.reply({ content: "Unmute OK", ephemeral: true });
}

async function handleWarn(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const reason = interaction.options.getString("reason", true);
  await mod.warn(member, interaction.user, reason);
  await interaction.reply({ content: "Warn enregistré.", ephemeral: true });
}

async function handleWarnings(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const rec = await prisma.guildMemberRecord.findUnique({
    where: { guildId_userId: { guildId: interaction.guild!.id, userId: user.id } },
  });
  await interaction.reply({
    content: `${user.tag} — warns: **${rec?.warnCount ?? 0}**`,
    ephemeral: true,
  });
}

async function handleClear(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const amount = interaction.options.getInteger("amount", true);
  const channel = interaction.channel;
  if (!channel?.isTextBased() || channel.isDMBased()) throw new Error("Salon invalide");
  const deleted = await channel.bulkDelete(amount, true);
  await interaction.editReply({ content: `${deleted.size} messages supprimés.` });
}

async function handleNuke(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "Confirme avec le bouton (à venir) ou utilise `/clear` sur le salon cible.",
    ephemeral: true,
  });
}
