import { randomUUID } from "node:crypto";
import { getRedis, funService, economyService } from "@sentinel/core";
import { prisma } from "@sentinel/database";
import { formatMoney } from "@sentinel/shared";

export type BlackjackSession = {
  id: string;
  guildId: string;
  userId: string;
  bet: number;
  player: number[];
  dealer: number[];
  doubled: boolean;
  finished: boolean;
};

const TTL = 600;

function total(cards: number[]) {
  return cards.reduce((a, b) => a + b, 0);
}

export async function startBlackjackSession(guildId: string, userId: string, bet: number): Promise<BlackjackSession> {
  const wallet = await economyService.getOrCreateWallet(guildId, userId);
  if (wallet.cash < bet) throw new Error(`Pas assez d'argent. Solde : ${formatMoney(wallet.cash)}.`);
  await prisma.userWallet.update({
    where: { guildId_userId: { guildId, userId } },
    data: { cash: { decrement: bet } },
  });
  const hand = funService.blackjackDeal();
  const session: BlackjackSession = {
    id: randomUUID().slice(0, 8),
    guildId,
    userId,
    bet,
    player: hand.player,
    dealer: hand.dealer,
    doubled: false,
    finished: false,
  };
  await getRedis().setex(`bj:${session.id}`, TTL, JSON.stringify(session));
  return session;
}

export async function getBlackjackSession(id: string): Promise<BlackjackSession | null> {
  const raw = await getRedis().get(`bj:${id}`);
  if (!raw) return null;
  return JSON.parse(raw) as BlackjackSession;
}

export async function saveBlackjackSession(session: BlackjackSession) {
  await getRedis().setex(`bj:${session.id}`, TTL, JSON.stringify(session));
}

export function blackjackSettlement(bet: number, win: boolean, push: boolean): number {
  if (push) return bet;
  if (win) return bet * 2;
  return 0;
}

export async function deleteBlackjackSession(id: string) {
  await getRedis().del(`bj:${id}`);
}

export function sessionPlayerTotal(s: BlackjackSession) {
  return total(s.player);
}

export function sessionDealerTotal(s: BlackjackSession) {
  return total(s.dealer);
}

export async function hitSession(s: BlackjackSession): Promise<BlackjackSession> {
  const hit = funService.blackjackHit(sessionPlayerTotal(s));
  s.player.push(hit.card);
  if (hit.bust) s.finished = true;
  await saveBlackjackSession(s);
  return s;
}

export async function doubleSession(s: BlackjackSession): Promise<BlackjackSession> {
  if (s.doubled || s.player.length > 2) throw new Error("Double impossible.");
  const extra = s.bet;
  await prisma.userWallet.update({
    where: { guildId_userId: { guildId: s.guildId, userId: s.userId } },
    data: { cash: { decrement: extra } },
  });
  s.bet *= 2;
  s.doubled = true;
  const hit = funService.blackjackHit(sessionPlayerTotal(s));
  s.player.push(hit.card);
  s.finished = true;
  await saveBlackjackSession(s);
  return s;
}

export async function standSession(s: BlackjackSession): Promise<{ session: BlackjackSession; payout: number; win: boolean; push: boolean }> {
  s.finished = true;
  while (sessionDealerTotal(s) < 17) {
    const hit = funService.blackjackHit(sessionDealerTotal(s));
    s.dealer.push(hit.card);
  }
  const pTotal = sessionPlayerTotal(s);
  const dTotal = sessionDealerTotal(s);
  const push = pTotal === dTotal;
  const win = !push && (dTotal > 21 || pTotal > dTotal) && pTotal <= 21;
  const payout = funService.blackjackPayout(s.bet, win, push);
  await saveBlackjackSession(s);
  return { session: s, payout, win, push };
}
