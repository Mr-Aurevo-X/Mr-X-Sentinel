import { prisma } from "@sentinel/database";
import type { Client } from "discord.js";
import { formatMoney } from "@sentinel/shared";
import { economyService } from "../economy/EconomyService.js";
import { logService } from "../../services/LogService.js";

export class FunService {
  coinflip(bet: number): { win: boolean; side: string; payout: number } {
    const win = Math.random() < 0.5;
    return { win, side: win ? "pile" : "face", payout: win ? bet : -bet };
  }

  slots(bet: number): { symbols: string[]; payout: number } {
    const symbols = ["🍒", "🍋", "💎", "7️⃣", "⭐"];
    const roll = [
      symbols[Math.floor(Math.random() * symbols.length)]!,
      symbols[Math.floor(Math.random() * symbols.length)]!,
      symbols[Math.floor(Math.random() * symbols.length)]!,
    ];
    let payout = -bet;
    if (roll[0] === roll[1] && roll[1] === roll[2]) payout = bet * 5;
    else if (roll[0] === roll[1] || roll[1] === roll[2]) payout = Math.floor(bet * 0.5);
    return { symbols: roll, payout };
  }

  roulette(bet: number, choice: "red" | "black" | "green"): { win: boolean; color: string; payout: number } {
    const n = Math.floor(Math.random() * 37);
    const color = n === 0 ? "green" : n % 2 === 0 ? "black" : "red";
    const win = color === choice;
    const mult = choice === "green" ? 14 : 2;
    return { win, color, payout: win ? bet * mult - bet : -bet };
  }

  blackjackDeal(): { player: number[]; dealer: number[]; playerTotal: number; dealerVisible: number } {
    const deck = () => Math.floor(Math.random() * 10) + 1;
    const p1 = deck();
    const p2 = deck();
    const d1 = deck();
    const d2 = deck();
    const norm = (n: number) => (n > 10 ? 10 : n);
    const player = [norm(p1), norm(p2)];
    const dealer = [norm(d1), norm(d2)];
    const playerTotal = player.reduce((a, b) => a + b, 0);
    return { player, dealer, playerTotal, dealerVisible: dealer[0]! };
  }

  blackjackHit(total: number): { card: number; newTotal: number; bust: boolean } {
    const card = Math.min(10, Math.floor(Math.random() * 10) + 1);
    const newTotal = total + card;
    return { card, newTotal, bust: newTotal > 21 };
  }

  blackjackPayout(bet: number, win: boolean, push: boolean): number {
    if (push) return 0;
    return win ? bet : -bet;
  }

  async applyBet(guildId: string, userId: string, payout: number, client: Client, game: string) {
    const wallet = await economyService.getOrCreateWallet(guildId, userId);
    const newCash = Math.max(0, wallet.cash + payout);
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: newCash },
    });
    if (Math.abs(payout) >= 500) {
      await logService.log(client, guildId, "economy", {
        title: `Casino — ${game}`,
        description: `<@${userId}> : ${payout >= 0 ? "+" : ""}${formatMoney(Math.abs(payout))}`,
        actorId: userId,
      });
    }
    return newCash;
  }
}

export const funService = new FunService();
