import type { Interaction, ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  lockdownService,
  snapshotService,
  enqueueRestore,
  isLockdownActive,
  logProvisioningService,
  logService,
  type ModerationService,
} from "@sentinel/core";
import { prisma, getGuildConfig } from "@sentinel/database";
import { chatCompletion, resetConversation } from "@sentinel/ai";
import { templateService } from "@sentinel/core";
import { buildFonctionnementEmbed, buildFonctionnementView } from "./fonctionnement.js";
import { buildLogsPanel, handleComponent } from "../interaction-router.js";
import { withCommand } from "./middleware.js";
import { assertSlashAccess } from "./permissions.js";
import {
  handleBalance,
  handleBuy,
  handleCrime,
  handleDaily,
  handleDeposit,
  handleEco,
  handleLeaderboard,
  handleMonthly,
  handlePay,
  handleRob,
  handleShop,
  handleUse,
  handleWeekly,
  handleWithdraw,
  handleWork,
} from "./handlers/economy.js";
import { handleFun, handleGamble, handleMinijeux } from "./handlers/fun.js";
import {
  handleRank,
  handleSetLevelChannel,
  handleRemoveLevelChannel,
  handleLevelsInfo,
  handleLvlInfo,
} from "./handlers/levels.js";
import { handleTemplatePanel } from "./handlers/templates.js";
import {
  handleAdmin,
  handleBrain,
  handleClearwarn,
  handleConfig,
  handleNickname,
  handlePlayMusic,
  handleSuggest,
} from "./handlers/admin.js";
import { handleTicket } from "./handlers/tickets.js";
import { handlePoll, handleGiveaway, handleReactionRole } from "./handlers/community.js";
import { handleAutomod } from "./handlers/automod.js";
import { handleOwner } from "./handlers/owner.js";
import {
  handlePing,
  handleBotInfo,
  handleUserInfo,
  handleStats,
  handleServerInfo,
  handleAvatar,
} from "./handlers/info.js";
import { handleMusic } from "./handlers/music.js";
import {
  handleChannel,
  handleSetspam,
  handleRemovespam,
  handleSetcounter,
  handleLevelsRoles,
  handleAfk,
  handleReminder,
  handleAutosetup,
  handleSeterrorlog,
  handleShadow,
} from "./handlers/extended.js";
import {
  buildHelpEmbed,
  buildPanelEmbed,
  buildSentinelMasterHubEmbed,
  buildSimpleEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
} from "../ui/embeds.js";
import { buildSentinelMasterHubRows } from "../views/HubViews.js";
import { buildHelpTierRows } from "../views/HelpView.js";
import { handleModal } from "../interaction-router.js";
import { buildModerationConfirmRows, buildModerationPanelRows } from "../views/ModerationViews.js";
import { defaultGuildFeatures } from "@sentinel/shared";

export async function handleInteraction(
  interaction: Interaction,
  moderation: ModerationService,
  client: import("discord.js").Client,
): Promise<void> {
  if (interaction.isModalSubmit() && interaction.guild) {
    await handleModal(interaction, client);
    return;
  }

  if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
    await handleComponent(interaction, client, moderation);
    return;
  }

  if (!interaction.isChatInputCommand() || !interaction.guild) return;

  try {
    assertSlashAccess(interaction);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Accès refusé.";
    await interaction
      .reply({ embeds: [errorEmbed("Accès refusé", msg)], ephemeral: true })
      .catch(() => undefined);
    return;
  }

  const name = interaction.commandName;
  const run = (fn: Parameters<typeof withCommand>[0], opts?: Parameters<typeof withCommand>[1]) =>
    withCommand(fn, opts)(interaction, client);

  if (name === "setup") await handleSetup(interaction, client);
  else if (name === "fonctionnement") await handleFonctionnement(interaction);
  else if (name === "logs") await handleLogs(interaction);
  else if (name === "sentinel") await handleSentinel(interaction);
  else if (name === "panel")
    await run(async () => ({ embeds: [buildPanelEmbed()], components: buildModerationPanelRows() }), { defer: false });
  else if (name === "security") await handleSecurity(interaction);
  else if (name === "automod") await run(handleAutomod, { defer: false, ephemeral: true });
  else if (name === "backup") await handleBackup(interaction);
  else if (name === "help")
    await run(async () => ({ embeds: [buildHelpEmbed("public")], components: buildHelpTierRows() }), {
      defer: false,
    });
  else if (name === "ping") await run(handlePing, { defer: false });
  else if (name === "botinfo") await run(handleBotInfo, { defer: false });
  else if (name === "userinfo") await run(handleUserInfo, { defer: false });
  else if (name === "rank") await run(handleRank, { module: "levels", loadingTitle: "Chargement du profil…" });
  else if (name === "chat") await handleChat(interaction);
  else if (name === "play") await run((i, c) => handlePlayMusic(i, c), { module: "music", ephemeral: false, loadingTitle: "Recherche…" });
  else if (name === "config") await run(handleConfig, { defer: false });
  else if (name === "admin") await run(handleAdmin, { defer: true });
  else if (name === "ticket") await run((i, c) => handleTicket(i, c), { module: "tickets" });
  else if (name === "fun") await run((i, c) => handleFun(i, c), { module: "fun", loadingTitle: "Jeu en cours…" });
  else if (name === "balance") await run(handleBalance, { module: "economy", loadingTitle: "Chargement du solde…" });
  else if (name === "pay") await run((i, c) => handlePay(i, c), { module: "economy" });
  else if (name === "rob") await run((i, c) => handleRob(i, c), { module: "economy", loadingTitle: "Braquage…" });
  else if (name === "crime") await run((i, c) => handleCrime(i, c), { module: "economy", loadingTitle: "Crime…" });
  else if (name === "deposit") await run(handleDeposit, { module: "economy" });
  else if (name === "withdraw") await run(handleWithdraw, { module: "economy" });
  else if (name === "leaderboard") await run(handleLeaderboard, { module: "economy", ephemeral: false });
  else if (name === "shop") await run((i, c) => handleShop(i, c), { module: "economy" });
  else if (name === "daily") await run((i, c) => handleDaily(i, c), { module: "economy" });
  else if (name === "weekly") await run((i, c) => handleWeekly(i, c), { module: "economy" });
  else if (name === "monthly") await run((i, c) => handleMonthly(i, c), { module: "economy" });
  else if (name === "work") await run((i, c) => handleWork(i, c), { module: "economy" });
  else if (name === "eco") await run(handleEco, { module: "economy", ephemeral: false });
  else if (name === "buy") await run(handleBuy, { module: "economy" });
  else if (name === "use") await run(handleUse, { module: "economy" });
  else if (name === "gamble") await run(handleGamble, { module: "fun", ephemeral: false });
  else if (name === "minijeux") await run(handleMinijeux, { module: "fun", ephemeral: false });
  else if (name === "setlevelchannel") await run(handleSetLevelChannel, { module: "levels", defer: false });
  else if (name === "removelevelchannel") await run(handleRemoveLevelChannel, { module: "levels", defer: false });
  else if (name === "levelsinfo") await run(handleLevelsInfo, { module: "levels", defer: false });
  else if (name === "lvl_info") await run(handleLvlInfo, { module: "levels", defer: false });
  else if (name === "template") await run(handleTemplatePanel, { module: "templates", ephemeral: false, defer: false });
  else if (name === "suggest") await run(handleSuggest, { defer: false });
  else if (name === "brain") await run((i) => handleBrain(i), { module: "brain", loadingTitle: "Connexion Brain…" });
  else if (name === "channel") await run(handleChannel, { module: "moderation", defer: false });
  else if (name === "setspam") await run(handleSetspam, { defer: false });
  else if (name === "removespam") await run(handleRemovespam, { defer: false });
  else if (name === "setcounter") await run(handleSetcounter, { defer: false });
  else if (name === "levels") await run(handleLevelsRoles, { defer: false });
  else if (name === "stats") await run(handleStats, { defer: false });
  else if (name === "serverinfo") await run(handleServerInfo, { defer: false });
  else if (name === "avatar") await run(handleAvatar, { defer: false });
  else if (name === "music") await run((i, c) => handleMusic(i, c), { module: "music", defer: false });
  else if (name === "afk") await run(handleAfk, { defer: false });
  else if (name === "reminder") await run(handleReminder, { defer: false });
  else if (name === "autosetup") await run((i, c) => handleAutosetup(i, c), { defer: true, loadingTitle: "Setup…" });
  else if (name === "seterrorlog") await run(handleSeterrorlog, { defer: false });
  else if (name === "shadow") await run(handleShadow, { defer: false });
  else if (name === "clearwarn") await run(handleClearwarn, { defer: false });
  else if (name === "nickname") await run(handleNickname, { defer: false });
  else if (name === "ban") await handleBan(interaction, moderation);
  else if (name === "unban") await handleUnban(interaction);
  else if (name === "kick") await handleKick(interaction, moderation);
  else if (name === "mute") await handleMute(interaction, moderation);
  else if (name === "unmute") await handleUnmute(interaction);
  else if (name === "warn") await handleWarn(interaction, moderation);
  else if (name === "warnings") await handleWarnings(interaction);
  else if (name === "clear") await handleClear(interaction);
  else if (name === "nuke") await handleNuke(interaction);
  else if (name === "softban") await handleSoftban(interaction, moderation);
  else if (name === "poll") await run(handlePoll, { module: "community" });
  else if (name === "giveaway") await run(handleGiveaway, { module: "community" });
  else if (name === "reactionrole") await run(handleReactionRole, { module: "community" });
  else if (name === "owner") await run((i, c) => handleOwner(i, c), { defer: false });
}

async function handleSetup(interaction: ChatInputCommandInteraction, client: import("discord.js").Client) {
  await withCommand(
    async () => {
      const guild = interaction.guild!;
      const createLogs = interaction.options.getBoolean("create_logs") ?? true;
      const templateKey = interaction.options.getString("template");

      if (templateKey) {
        await templateService.apply(guild, templateKey, client, interaction.user.id, { createLogs: false });
      }

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
        data: { quarantineRoleId: quarantineRole.id, setupComplete: true },
      });

      await logService.log(client, guild.id, "admin", {
        title: "Setup terminé",
        description: `Configuré par <@${interaction.user.id}>`,
        actorId: interaction.user.id,
      });

      return {
        embeds: [
          successEmbed(
            "Setup terminé",
            (templateKey ? `Template **${templateKey}** appliqué. ` : "") +
              (createLogs ? "Salons logs créés. " : "") +
              "Lance **/fonctionnement** pour le guide.",
          ),
        ],
      };
    },
    { loadingTitle: "Configuration…" },
  )(interaction, client);
}

async function handleFonctionnement(interaction: ChatInputCommandInteraction) {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    await interaction.reply({
      embeds: [buildSimpleEmbed("Accès refusé", "Réservé au **propriétaire** du serveur.", 0xed4245)],
      ephemeral: true,
    });
    return;
  }
  const features = (await getGuildConfig(interaction.guild!.id)).features;
  const isPublic = interaction.options.getBoolean("public") ?? false;
  const embed = buildFonctionnementEmbed(features);
  const components = buildFonctionnementView(features);
  await interaction.reply({ embeds: [embed], components, ephemeral: !isPublic });
}

async function handleLogs(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub === "create") {
    await withCommand(
      async () => {
        const channels = await logProvisioningService.provisionAll(interaction.guild!);
        return {
          embeds: [successEmbed("Logs créés", `${Object.keys(channels).length} salons configurés.`)],
        };
      },
      { loadingTitle: "Création des logs…" },
    )(interaction, {} as import("discord.js").Client);
    return;
  }
  await interaction.reply({
    embeds: [buildSimpleEmbed("Logs Sentinel", "12 types de logs — catégorie **Logs Sentinel**.")],
    components: buildLogsPanel(),
    ephemeral: true,
  });
}

async function handleSentinel(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const cfg = await getGuildConfig(guild.id);
  const defs = defaultGuildFeatures();
  const on = Object.keys(defs).filter((k) => cfg.features[k as keyof typeof cfg.features]).length;
  const banner = process.env.BRAND_BANNER_URL ?? null;
  await interaction.reply({
    embeds: [buildSentinelMasterHubEmbed(guild.name, guild.memberCount, on, Object.keys(defs).length, banner)],
    components: buildSentinelMasterHubRows(),
    ephemeral: true,
  });
}

async function handleSecurity(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const guild = interaction.guild!;

  if (sub === "status") {
    const cfg = await getGuildConfig(guildId);
    const lock = await isLockdownActive(guildId);
    await interaction.reply({
      embeds: [
        buildSimpleEmbed(
          "État sécurité",
          `Lockdown : **${lock ? "oui" : "non"}**\nAnti-nuke : **${cfg.antiNuke.enabled ? "on" : "off"}**`,
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "whitelist_add") {
    const user = interaction.options.getUser("user", true);
    const level = interaction.options.getString("level", true) as "EXTRA_OWNER" | "TRUSTED";
    await prisma.whitelistEntry.upsert({
      where: { guildId_userId: { guildId, userId: user.id } },
      create: { guildId, userId: user.id, level, addedBy: interaction.user.id },
      update: { level, addedBy: interaction.user.id },
    });
    await interaction.reply({
      embeds: [successEmbed("Whitelist", `<@${user.id}> ajouté (**${level}**).`)],
      ephemeral: true,
    });
    return;
  }

  if (sub === "whitelist_remove") {
    const user = interaction.options.getUser("user", true);
    await prisma.whitelistEntry.deleteMany({ where: { guildId, userId: user.id } });
    await interaction.reply({
      embeds: [successEmbed("Whitelist", `<@${user.id}> retiré.`)],
      ephemeral: true,
    });
    return;
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
    await interaction.reply({
      embeds: [buildSimpleEmbed("Whitelist anti-nuke", body)],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  try {
    if (sub === "lockdown") {
      await lockdownService.activate(guild, "Manuel");
      await interaction.editReply({ embeds: [successEmbed("Lockdown", "Lockdown activé.")] });
    } else if (sub === "unlock") {
      await lockdownService.deactivate(guild);
      await interaction.editReply({ embeds: [successEmbed("Unlock", "Lockdown désactivé.")] });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lockdown";
    await interaction.editReply({ embeds: [errorEmbed("Sécurité", msg)] }).catch(() => undefined);
  }
}

async function handleBackup(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;
  if (sub === "create") {
    await withCommand(
      async () => {
        const snapId = await snapshotService.capture(guild, "manual");
        return { embeds: [successEmbed("Snapshot", `\`${snapId}\` créé.`)] };
      },
      { loadingTitle: "Capture…" },
    )(interaction, {} as import("discord.js").Client);
  } else if (sub === "list") {
    const snaps = await prisma.snapshot.findMany({
      where: { guildId: guild.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    await interaction.reply({
      embeds: [
        buildSimpleEmbed(
          "Snapshots",
          snaps.length
            ? snaps.map((s) => `\`${s.id}\` — ${s.label}`).join("\n")
            : "Aucun snapshot.",
        ),
      ],
      ephemeral: true,
    });
  } else if (sub === "restore") {
    const id = interaction.options.getString("id", true);
    await enqueueRestore(guild.id, id);
    await interaction.reply({
      embeds: [successEmbed("Restauration", `Planifiée pour \`${id}\`.`)],
      ephemeral: true,
    });
  }
}

async function handleChat(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub === "reset") {
    await resetConversation(interaction.user.id, interaction.guild!.id);
    await interaction.reply({
      embeds: [successEmbed("IA", "Conversation réinitialisée.")],
      ephemeral: true,
    });
    return;
  }
  await withCommand(
    async () => {
      const prompt = interaction.options.getString("prompt", true);
      const reply = await chatCompletion(interaction.user.id, interaction.guild!.id, prompt);
      return { embeds: [buildSimpleEmbed("Mr-X IA", reply.slice(0, 4000))] };
    },
    { module: "ai", loadingTitle: "Réflexion…" },
  )(interaction, {} as import("discord.js").Client);
}

async function handleBan(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await withCommand(
    async () => {
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason", true);
      const days = interaction.options.getInteger("delete_days") ?? 1;
      await mod.ban(interaction.guild!.id, user.id, interaction.user, reason, days);
      return { embeds: [successEmbed("Ban", `${user.tag} banni.`)] };
    },
    { module: "moderation" },
  )(interaction, {} as import("discord.js").Client);
}

async function handleUnban(interaction: ChatInputCommandInteraction) {
  await withCommand(async () => {
    const userId = interaction.options.getString("user_id", true);
    await interaction.guild!.members.unban(userId).catch(() => undefined);
    return { embeds: [successEmbed("Unban", `Membre \`${userId}\` débanni.`)] };
  })(interaction, {} as import("discord.js").Client);
}

async function handleKick(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await withCommand(
    async () => {
      const member = interaction.options.getMember("user") as GuildMember | null;
      if (!member) throw new Error("Membre introuvable");
      const reason = interaction.options.getString("reason", true);
      await mod.kick(member, interaction.user, reason);
      return { embeds: [successEmbed("Kick", `${member.user.tag} expulsé.`)] };
    },
    { module: "moderation" },
  )(interaction, {} as import("discord.js").Client);
}

async function handleMute(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await withCommand(
    async () => {
      const member = interaction.options.getMember("user") as GuildMember | null;
      if (!member) throw new Error("Membre introuvable");
      const reason = interaction.options.getString("reason", true);
      const minutes = interaction.options.getInteger("minutes", true);
      await mod.mute(member, interaction.user, reason, minutes * 60_000);
      return { embeds: [successEmbed("Mute", `${member.user.tag} mute ${minutes} min.`)] };
    },
    { module: "moderation" },
  )(interaction, {} as import("discord.js").Client);
}

async function handleUnmute(interaction: ChatInputCommandInteraction) {
  await withCommand(async () => {
    const member = interaction.options.getMember("user") as GuildMember | null;
    if (!member) throw new Error("Membre introuvable");
    await member.timeout(null);
    return { embeds: [successEmbed("Unmute", "Timeout retiré.")] };
  })(interaction, {} as import("discord.js").Client);
}

async function handleWarn(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await withCommand(
    async () => {
      const member = interaction.options.getMember("user") as GuildMember | null;
      if (!member) throw new Error("Membre introuvable");
      const reason = interaction.options.getString("reason", true);
      await mod.warn(member, interaction.user, reason);
      return { embeds: [successEmbed("Warn", "Avertissement enregistré.")] };
    },
    { module: "moderation", defer: false },
  )(interaction, {} as import("discord.js").Client);
}

async function handleWarnings(interaction: ChatInputCommandInteraction) {
  await withCommand(async () => {
    const user = interaction.options.getUser("user", true);
    const rec = await prisma.guildMemberRecord.findUnique({
      where: { guildId_userId: { guildId: interaction.guild!.id, userId: user.id } },
    });
    return {
      embeds: [buildSimpleEmbed("Avertissements", `${user.tag} — **${rec?.warnCount ?? 0}** warn(s).`)],
    };
  }, { defer: false })(interaction, {} as import("discord.js").Client);
}

async function handleClear(interaction: ChatInputCommandInteraction) {
  await withCommand(
    async () => {
      const amount = interaction.options.getInteger("amount", true);
      const channel = interaction.channel;
      if (!channel?.isTextBased() || channel.isDMBased()) throw new Error("Salon invalide");
      const deleted = await channel.bulkDelete(amount, true);
      return { embeds: [successEmbed("Clear", `${deleted.size} messages supprimés.`)] };
    },
    { module: "moderation" },
  )(interaction, {} as import("discord.js").Client);
}

async function handleNuke(interaction: ChatInputCommandInteraction) {
  await withCommand(async () => {
    const channelId = interaction.channelId;
    return {
      embeds: [
        warningEmbed(
          "Nuke salon",
          "⚠️ **Action destructive** — ce salon sera cloné puis supprimé.\nConfirme pour continuer.",
        ),
      ],
      components: buildModerationConfirmRows("nuke", channelId),
    };
  }, { module: "moderation", defer: false, ephemeral: true })(interaction, {} as import("discord.js").Client);
}

async function handleSoftban(interaction: ChatInputCommandInteraction, mod: ModerationService) {
  await withCommand(
    async () => {
      const member = interaction.options.getMember("user") as GuildMember | null;
      if (!member) throw new Error("Membre introuvable");
      const reason = interaction.options.getString("reason", true);
      await mod.softban(member, interaction.user, reason);
      return { embeds: [successEmbed("Softban", `${member.user.tag} softban (messages purgés).`)] };
    },
    { module: "moderation" },
  )(interaction, {} as import("discord.js").Client);
}
