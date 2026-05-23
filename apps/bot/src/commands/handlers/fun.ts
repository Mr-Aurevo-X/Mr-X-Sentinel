import type { ChatInputCommandInteraction } from "discord.js";
import { economyService, funService } from "@sentinel/core";
import { formatMoney } from "@sentinel/shared";
import { buildFunResultEmbed, buildBlackjackEmbed, buildGambleHubEmbed, buildMinijeuxHubEmbed, buildSlotsSpinEmbed } from "../../ui/embeds.js";
import { buildGambleHubRows, buildMinijeuxHubRows } from "../../views/HubViews.js";
import { buildBlackjackRows } from "../../views/BlackjackView.js";
import { startBlackjackSession, sessionPlayerTotal } from "../../services/BlackjackSession.js";
import type { CommandReply } from "../middleware.js";

export async function handleFun(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const userId = interaction.user.id;

  if (sub === "blackjack") {
    const bet = interaction.options.getInteger("bet", true);
    const wallet = await economyService.getOrCreateWallet(guildId, userId);
    if (wallet.cash < bet) throw new Error(`Pas assez d'argent. Solde : ${formatMoney(wallet.cash)}.`);
    const session = await startBlackjackSession(guildId, userId, bet);
    if (sessionPlayerTotal(session) === 21) {
      const bal = await funService.applyBet(guildId, userId, bet * 2, client, "blackjack");
      return {
        embeds: [buildFunResultEmbed("Blackjack", "🎉 Blackjack naturel !", bet, bal, true)],
      };
    }
    return {
      embeds: [
        buildBlackjackEmbed(session.player, sessionPlayerTotal(session), session.dealer[0]!, bet),
      ],
      components: buildBlackjackRows(session.id),
    };
  }

  const bet = interaction.options.getInteger("bet", true);
  const wallet = await economyService.getOrCreateWallet(guildId, userId);
  if (wallet.cash < bet) throw new Error(`Pas assez d'argent. Solde : ${formatMoney(wallet.cash)}.`);

  if (sub === "coinflip") {
    const r = funService.coinflip(bet);
    const bal = await funService.applyBet(guildId, userId, r.payout, client, "coinflip");
    return {
      embeds: [
        buildFunResultEmbed(
          "Pile ou face",
          `Résultat : **${r.side}**`,
          r.payout,
          bal,
          r.win,
        ),
      ],
    };
  }

  if (sub === "slots") {
    await interaction.editReply({ embeds: [buildSlotsSpinEmbed(["?", "?", "?"])] });
    await new Promise((r) => setTimeout(r, 800));
    const r = funService.slots(bet);
    const bal = await funService.applyBet(guildId, userId, r.payout, client, "slots");
    return {
      embeds: [
        buildFunResultEmbed(
          "Machine à sous",
          r.symbols.join(" │ "),
          r.payout,
          bal,
          r.payout > 0,
        ),
      ],
    };
  }

  const color = interaction.options.getString("color", true) as "red" | "black" | "green";
  const r = funService.roulette(bet, color);
  const bal = await funService.applyBet(guildId, userId, r.payout, client, "roulette");
  return {
    embeds: [
      buildFunResultEmbed(
        "Roulette",
        `Tirage **${r.color}** — ${r.win ? "gagné" : "perdu"}`,
        r.payout,
        bal,
        r.win,
      ),
    ],
  };
}

export async function handleGamble(): Promise<CommandReply> {
  return { embeds: [buildGambleHubEmbed()], components: buildGambleHubRows() };
}

export async function handleMinijeux(): Promise<CommandReply> {
  return { embeds: [buildMinijeuxHubEmbed()], components: buildMinijeuxHubRows() };
}
