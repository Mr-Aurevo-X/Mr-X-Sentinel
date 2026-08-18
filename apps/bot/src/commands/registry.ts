import type { ModerationService } from "@sentinel/core";
import type { CommandHandler, CommandOptions } from "./middleware.js";
import { handleSetup } from "./handlers/setup.js";
import {
  handleFonctionnement,
  handleHelp,
  handleLogs,
  handlePanel,
  handleSentinel,
} from "./handlers/guide.js";
import { handleSecurity } from "./handlers/security.js";
import { handleBackup } from "./handlers/backup.js";
import { handleAutomod } from "./handlers/automod.js";
import {
  handleBan,
  handleClear,
  handleKick,
  handleMute,
  handleNuke,
  handleSoftban,
  handleUnban,
  handleUnmute,
  handleWarn,
  handleWarnings,
} from "./handlers/moderation.js";
import {
  handleBalance,
  handleCrime,
  handleDaily,
  handleDeposit,
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
import { handleFun } from "./handlers/fun.js";
import { handleRank, handleLevels, handleLvlInfo } from "./handlers/levels.js";
import { handleTemplatePanel } from "./handlers/templates.js";
import { handleMusic } from "./handlers/music.js";
import { handleBirthday, handleCounting, handleTempVc } from "./handlers/community-extra.js";
import {
  handleAdmin,
  handleClearwarn,
  handleConfig,
  handleNickname,
  handleSuggest,
} from "./handlers/admin.js";
import { handleTicket } from "./handlers/tickets.js";
import { handlePoll, handleGiveaway, handleReactionRole, handleStarboard, handleVerify } from "./handlers/community.js";
import { handleOwner } from "./handlers/owner.js";
import {
  handlePing,
  handleBotInfo,
  handleUserInfo,
  handleServerInfo,
  handleAvatar,
} from "./handlers/info.js";
import { handleChannel, handleAfk, handleReminder, handleShadow } from "./handlers/extended.js";
import {
  handleAddCommand,
  handleListCommands,
  handleRemoveCommand,
} from "./handlers/custom-commands.js";
import { commands } from "./definitions/index.js";

const reservedSlashNames = commands.map((c) => c.name);

export type CommandEntry = {
  handler: CommandHandler;
  options?: CommandOptions;
};

export function buildCommandRegistry(moderation: ModerationService): Record<string, CommandEntry> {
  return {
    setup: { handler: handleSetup, options: { loadingTitle: "Configuration…" } },
    fonctionnement: {
      handler: handleFonctionnement,
      options: {
        loadingTitle: "Guide…",
        ephemeral: (i) => !(i.options.getBoolean("public") ?? false),
      },
    },
    logs: { handler: handleLogs },
    sentinel: { handler: handleSentinel, options: { defer: false } },
    panel: { handler: handlePanel, options: { defer: false } },
    security: { handler: handleSecurity, options: { module: "security" } },
    automod: { handler: handleAutomod, options: { defer: false, ephemeral: true, module: "automod" } },
    backup: { handler: handleBackup, options: { module: "snapshots" } },
    help: { handler: handleHelp, options: { defer: false } },
    ping: { handler: handlePing, options: { defer: false } },
    botinfo: { handler: handleBotInfo, options: { defer: false } },
    userinfo: { handler: handleUserInfo, options: { defer: false } },
    rank: { handler: handleRank, options: { module: "levels", loadingTitle: "Chargement du profil…" } },
    music: {
      handler: handleMusic,
      options: {
        module: "music",
        loadingTitle: "Musique…",
        ephemeral: (i) => i.options.getSubcommand() !== "play",
      },
    },
    birthday: { handler: (i) => handleBirthday(i), options: { module: "community" } },
    tempvc: { handler: (i) => handleTempVc(i), options: { module: "community" } },
    counting: { handler: (i) => handleCounting(i), options: { module: "community" } },
    config: { handler: handleConfig, options: { defer: false } },
    admin: { handler: handleAdmin, options: { defer: true } },
    ticket: { handler: handleTicket, options: { module: "tickets" } },
    fun: { handler: handleFun, options: { module: "fun", loadingTitle: "Jeu en cours…" } },
    balance: { handler: handleBalance, options: { module: "economy", loadingTitle: "Chargement du solde…" } },
    pay: { handler: handlePay, options: { module: "economy" } },
    rob: { handler: handleRob, options: { module: "economy", loadingTitle: "Braquage…" } },
    crime: { handler: handleCrime, options: { module: "economy", loadingTitle: "Crime…" } },
    deposit: { handler: handleDeposit, options: { module: "economy" } },
    withdraw: { handler: handleWithdraw, options: { module: "economy" } },
    leaderboard: { handler: handleLeaderboard, options: { module: "economy", ephemeral: false } },
    shop: { handler: handleShop, options: { module: "economy" } },
    daily: { handler: handleDaily, options: { module: "economy" } },
    weekly: { handler: handleWeekly, options: { module: "economy" } },
    monthly: { handler: handleMonthly, options: { module: "economy" } },
    work: { handler: handleWork, options: { module: "economy" } },
    use: { handler: handleUse, options: { module: "economy" } },
    lvl_info: { handler: handleLvlInfo, options: { module: "levels", defer: false } },
    template: { handler: handleTemplatePanel, options: { module: "templates", ephemeral: false, defer: false } },
    suggest: { handler: handleSuggest, options: { defer: false } },
    channel: { handler: handleChannel, options: { module: "moderation", defer: false } },
    levels: { handler: handleLevels, options: { defer: false } },
    serverinfo: { handler: handleServerInfo, options: { defer: false } },
    avatar: { handler: handleAvatar, options: { defer: false } },
    afk: { handler: handleAfk, options: { defer: false } },
    reminder: { handler: handleReminder, options: { loadingTitle: "Rappel…" } },
    shadow: { handler: handleShadow, options: { defer: false } },
    clearwarn: { handler: handleClearwarn, options: { defer: false } },
    nickname: { handler: handleNickname, options: { defer: false } },
    ban: { handler: (i) => handleBan(i, moderation), options: { module: "moderation" } },
    unban: { handler: handleUnban },
    kick: { handler: (i) => handleKick(i, moderation), options: { module: "moderation" } },
    mute: { handler: (i) => handleMute(i, moderation), options: { module: "moderation" } },
    unmute: { handler: handleUnmute },
    warn: { handler: (i) => handleWarn(i, moderation), options: { module: "moderation" } },
    warnings: { handler: handleWarnings, options: { defer: false } },
    clear: { handler: handleClear, options: { module: "moderation" } },
    nuke: { handler: handleNuke, options: { module: "moderation", ephemeral: true, loadingTitle: "Nuke…" } },
    softban: { handler: (i) => handleSoftban(i, moderation), options: { module: "moderation" } },
    poll: { handler: handlePoll, options: { module: "community" } },
    giveaway: { handler: handleGiveaway, options: { module: "community" } },
    reactionrole: { handler: handleReactionRole, options: { module: "community" } },
    starboard: { handler: handleStarboard, options: { module: "community" } },
    verify: { handler: handleVerify, options: { module: "community", ephemeral: true } },
    addcommand: {
      handler: (i) => handleAddCommand(i, reservedSlashNames),
      options: { loadingTitle: "Commande perso…" },
    },
    removecommand: {
      handler: handleRemoveCommand,
      options: { loadingTitle: "Commande perso…" },
    },
    listcommands: { handler: handleListCommands, options: { defer: false } },
    owner: { handler: handleOwner, options: { defer: false } },
  };
}

export function listRegisteredCommandNames(moderation: ModerationService): string[] {
  return Object.keys(buildCommandRegistry(moderation));
}
