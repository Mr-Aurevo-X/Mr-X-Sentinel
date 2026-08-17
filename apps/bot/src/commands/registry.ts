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
import { handleMusic } from "./handlers/music.js";
import { handleBirthday, handleCounting, handleTempVc } from "./handlers/community-extra.js";
import {
  handleAdmin,
  handleClearwarn,
  handleConfig,
  handleNickname,
  handlePlayMusic,
  handleSuggest,
} from "./handlers/admin.js";
import { handleTicket } from "./handlers/tickets.js";
import { handlePoll, handleGiveaway, handleReactionRole } from "./handlers/community.js";
import { handleOwner } from "./handlers/owner.js";
import {
  handlePing,
  handleBotInfo,
  handleUserInfo,
  handleStats,
  handleServerInfo,
  handleAvatar,
} from "./handlers/info.js";
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
    play: {
      handler: handlePlayMusic,
      options: { module: "music", ephemeral: false, loadingTitle: "Recherche…" },
    },
    music: { handler: handleMusic, options: { module: "music", defer: false } },
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
    eco: { handler: handleEco, options: { module: "economy", ephemeral: false } },
    buy: { handler: handleBuy, options: { module: "economy" } },
    use: { handler: handleUse, options: { module: "economy" } },
    gamble: { handler: handleGamble, options: { module: "fun", ephemeral: false } },
    minijeux: { handler: handleMinijeux, options: { module: "fun", ephemeral: false } },
    setlevelchannel: { handler: handleSetLevelChannel, options: { module: "levels", defer: false } },
    removelevelchannel: { handler: handleRemoveLevelChannel, options: { module: "levels", defer: false } },
    levelsinfo: { handler: handleLevelsInfo, options: { module: "levels", defer: false } },
    lvl_info: { handler: handleLvlInfo, options: { module: "levels", defer: false } },
    template: { handler: handleTemplatePanel, options: { module: "templates", ephemeral: false, defer: false } },
    suggest: { handler: handleSuggest, options: { defer: false } },
    channel: { handler: handleChannel, options: { module: "moderation", defer: false } },
    setspam: { handler: handleSetspam, options: { defer: false } },
    removespam: { handler: handleRemovespam, options: { defer: false } },
    setcounter: { handler: handleSetcounter, options: { defer: false } },
    levels: { handler: handleLevelsRoles, options: { defer: false } },
    stats: { handler: handleStats, options: { defer: false } },
    serverinfo: { handler: handleServerInfo, options: { defer: false } },
    avatar: { handler: handleAvatar, options: { defer: false } },
    afk: { handler: handleAfk, options: { defer: false } },
    reminder: { handler: handleReminder, options: { defer: false } },
    autosetup: { handler: handleAutosetup, options: { defer: true, loadingTitle: "Setup…" } },
    seterrorlog: { handler: handleSeterrorlog, options: { defer: false } },
    shadow: { handler: handleShadow, options: { defer: false } },
    clearwarn: { handler: handleClearwarn, options: { defer: false } },
    nickname: { handler: handleNickname, options: { defer: false } },
    ban: { handler: (i) => handleBan(i, moderation), options: { module: "moderation" } },
    unban: { handler: handleUnban },
    kick: { handler: (i) => handleKick(i, moderation), options: { module: "moderation" } },
    mute: { handler: (i) => handleMute(i, moderation), options: { module: "moderation" } },
    unmute: { handler: handleUnmute },
    warn: { handler: (i) => handleWarn(i, moderation), options: { module: "moderation", defer: false } },
    warnings: { handler: handleWarnings, options: { defer: false } },
    clear: { handler: handleClear, options: { module: "moderation" } },
    nuke: { handler: handleNuke, options: { module: "moderation", defer: false, ephemeral: true } },
    softban: { handler: (i) => handleSoftban(i, moderation), options: { module: "moderation" } },
    poll: { handler: handlePoll, options: { module: "community" } },
    giveaway: { handler: handleGiveaway, options: { module: "community" } },
    reactionrole: { handler: handleReactionRole, options: { module: "community" } },
    owner: { handler: handleOwner, options: { defer: false } },
  };
}

export function listRegisteredCommandNames(moderation: ModerationService): string[] {
  return Object.keys(buildCommandRegistry(moderation));
}
