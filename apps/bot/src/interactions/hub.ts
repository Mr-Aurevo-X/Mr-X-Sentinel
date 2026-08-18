import type { GuildMember } from "discord.js";
import {
  economyService,
  funService,
  levelsService,
  sectionContent,
  type FonctionnementSection,
} from "@sentinel/core";
import { formatMoney } from "@sentinel/shared";
import { getGuildConfig } from "@sentinel/database";
import { buildFonctionnementView } from "../commands/fonctionnement.js";
import {
  buildBlackjackEmbed,
  buildFunResultEmbed,
  buildGambleHubEmbed,
  buildHelpEmbed,
  buildLeaderboardEmbed,
  buildRankEmbed,
  buildSimpleEmbed,
  buildSlotsSpinEmbed,
  errorEmbed,
  formatLeaderboardEconomyLines,
  formatLeaderboardGlobalLines,
  formatLeaderboardLevelLines,
} from "../ui/embeds.js";
import { buildGambleHubRows, buildSentinelMasterHubRows } from "../views/HubViews.js";
import { buildLeaderboardView, type LeaderboardTab } from "../views/LeaderboardView.js";
import { buildBlackjackRows } from "../views/BlackjackView.js";
import { renderEcoTab, runEconomyReward, type EcoTab } from "../services/EconomyActions.js";
import {
  blackjackSettlement,
  deleteBlackjackSession,
  doubleSession,
  getBlackjackSession,
  hitSession,
  sessionDealerTotal,
  sessionPlayerTotal,
  standSession,
  startBlackjackSession,
} from "../services/BlackjackSession.js";
import { ackComponent, editComponent } from "../commands/ack.js";
import type { ComponentHandler } from "./types.js";

const PER_PAGE = 10;
const MINIJEU_BET = 50;

export const handleFonctionnementComponent: ComponentHandler = async ({ interaction, guild }) => {
  if (!interaction.isStringSelectMenu()) return;
  const section = interaction.values[0] as FonctionnementSection;
  const features = (await getGuildConfig(guild.id)).features;
  const { title, body } = sectionContent(section, features);
  await editComponent(interaction, {
    embeds: [buildSimpleEmbed(`Mr-X Sentinel — ${title}`, body)],
    components: buildFonctionnementView(features, section),
  });
};

export const handleEcoComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  await ackComponent(interaction, "update");
  const member = interaction.member as GuildMember;
  const tab = (parsed.action as EcoTab) || "home";
  const payload = await renderEcoTab(tab, member, guild.id);
  await interaction.editReply(payload);
};

export const handleLeaderboardComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  await ackComponent(interaction, "update");
  const ecoRows = await economyService.leaderboard(guild.id, 50);
  const levelRows = await levelsService.leaderboard(guild.id, 50);
  const globalRows = await levelsService.globalLeaderboard(guild.id, 50);
  let tab: LeaderboardTab = "economy";
  let page = 1;

  if (parsed.action === "economy" || parsed.action === "levels" || parsed.action === "global") {
    tab = parsed.action;
    page = parseInt(parsed.extra ?? "1", 10) || 1;
  } else if (parsed.action === "prev" || parsed.action === "next") {
    const [t, p] = (parsed.extra ?? "economy:1").split(":");
    tab = (t as LeaderboardTab) || "economy";
    page = parseInt(p ?? "1", 10) || 1;
    if (parsed.action === "prev") page = Math.max(1, page - 1);
    else page += 1;
  }

  const rows = tab === "economy" ? ecoRows : tab === "levels" ? levelRows : globalRows;
  const maxPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  page = Math.min(page, maxPages);
  const start = (page - 1) * PER_PAGE;

  const lines =
    tab === "economy"
      ? formatLeaderboardEconomyLines(
          ecoRows.slice(start, start + PER_PAGE).map((r) => ({ userId: r.userId, total: r.total })),
          start,
        )
      : tab === "levels"
        ? formatLeaderboardLevelLines(
            levelRows.slice(start, start + PER_PAGE).map((r) => ({ userId: r.userId, level: r.level, xp: r.xp })),
            start,
          )
        : formatLeaderboardGlobalLines(
            globalRows.slice(start, start + PER_PAGE).map((r) => ({
              userId: r.userId,
              score: r.score,
              level: r.level,
            })),
            start,
          );

  await interaction.editReply({
    embeds: [buildLeaderboardEmbed(tab, guild.name, guild.iconURL(), lines, page, maxPages)],
    components: buildLeaderboardView(tab, page, maxPages, ecoRows, levelRows, globalRows),
  });
};

export const handleSentinelComponent: ComponentHandler = async ({ interaction, guild, parsed }) => {
  if (parsed.action === "eco") {
    await ackComponent(interaction, "update");
    const member = interaction.member as GuildMember;
    const payload = await renderEcoTab("home", member, guild.id);
    await interaction.editReply(payload);
    return;
  }
  if (parsed.action === "gamble") {
    await ackComponent(interaction, "update");
    await interaction.editReply({ embeds: [buildGambleHubEmbed()], components: buildGambleHubRows() });
    return;
  }
  if (parsed.action === "help") {
    await ackComponent(interaction, "update");
    const features = (await getGuildConfig(guild.id)).features;
    await interaction.editReply({
      embeds: [buildHelpEmbed("public", features)],
      components: buildSentinelMasterHubRows(features),
    });
    return;
  }
  if (parsed.action === "rank") {
    await ackComponent(interaction, "ephemeral");
    const row = await levelsService.getOrCreate(guild.id, interaction.user.id);
    const member = interaction.member as GuildMember;
    const { currentLevelXp, nextLevelXp } = levelsService.getProgress(row.xp, row.level);
    await interaction.editReply({
      embeds: [
        buildRankEmbed(member.displayName, member.displayAvatarURL(), row.level, row.xp, nextLevelXp, currentLevelXp),
      ],
    });
  }
};

export const handleEconomyRewardComponent: ComponentHandler = async ({ interaction, client, guild, parsed }) => {
  if (parsed.action !== "daily" && parsed.action !== "work") return;
  await ackComponent(interaction, "ephemeral");
  const { embed } = await runEconomyReward(parsed.action, guild.id, interaction.user.id, client);
  await interaction.editReply({ embeds: [embed] });
};

export const handleFunComponent: ComponentHandler = async ({ interaction, client, guild, parsed }) => {
  const bet = 50;
  const runHubBetGame = async (run: () => { payout: number; text: string; win: boolean }) => {
    await ackComponent(interaction, "ephemeral");
    const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
    if (wallet.cash < bet) {
      await interaction.editReply({ embeds: [errorEmbed("Fonds insuffisants", `Minimum ${formatMoney(bet)}.`)] });
      return;
    }
    const r = run();
    const bal = await funService.applyBet(guild.id, interaction.user.id, r.payout, client, "casino");
    await interaction.editReply({ embeds: [buildFunResultEmbed("Casino", r.text, r.payout, bal, r.win)] });
  };

  if (parsed.action === "coinflip") {
    await runHubBetGame(() => {
      const r = funService.coinflip(bet);
      return { payout: r.payout, text: `Résultat : **${r.side}**`, win: r.win };
    });
    return;
  }
  if (parsed.action === "roulette") {
    await runHubBetGame(() => {
      const r = funService.roulette(bet, Math.random() < 0.5 ? "red" : "black");
      return { payout: r.payout, text: `Tirage **${r.color}**`, win: r.win };
    });
    return;
  }
  if (parsed.action === "blackjack") {
    await ackComponent(interaction, "ephemeral");
    const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
    if (wallet.cash < bet) {
      await interaction.editReply({ embeds: [errorEmbed("Fonds insuffisants", `Minimum ${formatMoney(bet)}.`)] });
      return;
    }
    const session = await startBlackjackSession(guild.id, interaction.user.id, bet);
    await interaction.editReply({
      embeds: [buildBlackjackEmbed(session.player, sessionPlayerTotal(session), session.dealer[0]!, bet)],
      components: buildBlackjackRows(session.id),
    });
    return;
  }
  if (parsed.action === "slots") {
    await ackComponent(interaction, "ephemeral");
    const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
    if (wallet.cash < bet) {
      await interaction.editReply({ embeds: [errorEmbed("Fonds insuffisants", `Minimum ${formatMoney(bet)}.`)] });
      return;
    }
    await interaction.editReply({ embeds: [buildSlotsSpinEmbed(["?", "?", "?"])] });
    await new Promise((r) => setTimeout(r, 600));
    const r = funService.slots(bet);
    const bal = await funService.applyBet(guild.id, interaction.user.id, r.payout, client, "slots");
    await interaction.editReply({
      embeds: [buildFunResultEmbed("Slots", r.symbols.join(" │ "), r.payout, bal, r.payout > 0)],
    });
  }
};

export const handleMinijeuComponent: ComponentHandler = async ({ interaction, client, guild, parsed }) => {
  await ackComponent(interaction, "ephemeral");
  const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
  if (wallet.cash < MINIJEU_BET) {
    await interaction.editReply({
      embeds: [errorEmbed("Fonds insuffisants", `Mise : **${formatMoney(MINIJEU_BET)}**`)],
    });
    return;
  }
  if (parsed.action === "rps") {
    const choices = ["pierre", "feuille", "ciseaux"];
    const bot = choices[Math.floor(Math.random() * 3)]!;
    const player = choices[Math.floor(Math.random() * 3)]!;
    const win =
      (player === "pierre" && bot === "ciseaux") ||
      (player === "feuille" && bot === "pierre") ||
      (player === "ciseaux" && bot === "feuille");
    const payout = win ? MINIJEU_BET : -MINIJEU_BET;
    const bal = await funService.applyBet(guild.id, interaction.user.id, payout, client, "rps");
    await interaction.editReply({
      embeds: [buildFunResultEmbed("RPS", `Toi : **${player}** · Bot : **${bot}**`, payout, bal, win)],
    });
    return;
  }
  if (parsed.action === "dice") {
    const roll = Math.floor(Math.random() * 6) + 1;
    const win = roll >= 4;
    const payout = win ? MINIJEU_BET : -MINIJEU_BET;
    const bal = await funService.applyBet(guild.id, interaction.user.id, payout, client, "dice");
    await interaction.editReply({
      embeds: [buildFunResultEmbed("🎲 Dé", `Résultat : **${roll}**`, payout, bal, win)],
    });
    return;
  }
  if (parsed.action === "guess") {
    const n = Math.floor(Math.random() * 10) + 1;
    const win = n >= 7;
    const payout = win ? MINIJEU_BET * 2 : -MINIJEU_BET;
    const bal = await funService.applyBet(guild.id, interaction.user.id, payout, client, "guess");
    await interaction.editReply({
      embeds: [buildFunResultEmbed("🔢 Devine", `Le nombre était **${n}**`, payout, bal, win)],
    });
  }
};

export const handleBlackjackComponent: ComponentHandler = async ({ interaction, client, guild, parsed }) => {
  if (!parsed.extra) return;
  await ackComponent(interaction, "update");
  const session = await getBlackjackSession(parsed.extra);
  if (!session || session.userId !== interaction.user.id) {
    await interaction.editReply({ embeds: [errorEmbed("Session expirée")], components: [] });
    return;
  }
  if (parsed.action === "hit") {
    const s = await hitSession(session);
    if (s.finished) {
      const bal = await funService.applyBet(guild.id, s.userId, 0, client, "blackjack");
      await deleteBlackjackSession(s.id);
      await interaction.editReply({
        embeds: [buildFunResultEmbed("Blackjack", "Bust !", -s.bet, bal, false)],
        components: [],
      });
      return;
    }
    await interaction.editReply({
      embeds: [buildBlackjackEmbed(s.player, sessionPlayerTotal(s), s.dealer[0]!, s.bet)],
      components: buildBlackjackRows(s.id),
    });
    return;
  }
  if (parsed.action === "double") {
    const s = await doubleSession(session);
    const { session: fin, payout, win, push } = await standSession(s);
    const settlement = blackjackSettlement(s.bet, win && !push, push);
    const bal = await funService.applyBet(guild.id, s.userId, settlement, client, "blackjack");
    await deleteBlackjackSession(s.id);
    await interaction.editReply({
      embeds: [
        buildFunResultEmbed(
          "Blackjack",
          `Double ! Croupier **${sessionDealerTotal(fin)}**`,
          payout,
          bal,
          win && !push,
        ),
      ],
      components: [],
    });
    return;
  }
  if (parsed.action === "stand") {
    const { session: s, payout, win, push } = await standSession(session);
    const settlement = blackjackSettlement(s.bet, win && !push, push);
    const bal = await funService.applyBet(guild.id, s.userId, settlement, client, "blackjack");
    await deleteBlackjackSession(s.id);
    await interaction.editReply({
      embeds: [
        buildFunResultEmbed(
          "Blackjack",
          `Croupier **${sessionDealerTotal(s)}**${push ? " — égalité" : ""}`,
          payout,
          bal,
          win && !push,
        ),
      ],
      components: [],
    });
  }
};
