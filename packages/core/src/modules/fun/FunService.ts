import { prisma } from "@sentinel/database";
import type { Client } from "discord.js";
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
        description: `<@${userId}> : ${payout >= 0 ? "+" : ""}${payout} coins`,
        actorId: userId,
      });
    }
    return newCash;
  }
}

export const funService = new FunService();
