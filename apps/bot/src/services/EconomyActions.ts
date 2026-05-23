import type { Client, GuildMember } from "discord.js";
import { economyService, inventoryService } from "@sentinel/core";
import { formatMoney, SHOP_CATALOG } from "@sentinel/shared";
import {
  buildEcoBankEmbed,
  buildEcoHubHomeEmbed,
  buildEcoInfoEmbed,
  buildInventoryEmbed,
  buildRewardEmbed,
  buildShopCatalogEmbed,
} from "../ui/embeds.js";
import { buildEconomyHubRows } from "../views/HubViews.js";

export type EcoTab = "home" | "bank" | "inventory" | "shop" | "info";
export type EconomyRewardAction = "daily" | "weekly" | "monthly" | "work";

const REWARD_LABELS: Record<EconomyRewardAction, string> = {
  daily: "🎁 Daily",
  weekly: "📅 Weekly",
  monthly: "🗓️ Monthly",
  work: "💼 Travail",
};

export async function runEconomyReward(
  action: EconomyRewardAction,
  guildId: string,
  userId: string,
  client: Client,
) {
  const fn = {
    daily: () => economyService.daily(guildId, userId),
    weekly: () => economyService.weekly(guildId, userId),
    monthly: () => economyService.monthly(guildId, userId),
    work: () => economyService.work(guildId, userId),
  }[action];
  const { reward, wallet } = await fn();
  await economyService.logEconomy(
    client,
    guildId,
    REWARD_LABELS[action],
    `<@${userId}> +${formatMoney(reward)}`,
    userId,
  );
  return { embed: buildRewardEmbed(REWARD_LABELS[action], reward, wallet.cash, wallet.bank) };
}

export async function renderEcoTab(tab: EcoTab, member: GuildMember, guildId: string) {
  const w = await economyService.getOrCreateWallet(guildId, member.id);
  const items = await inventoryService.list(guildId, member.id);

  const embeds = {
    home: buildEcoHubHomeEmbed(member.displayName, member.displayAvatarURL(), w.cash, w.bank, items.length),
    bank: buildEcoBankEmbed(w.cash, w.bank),
    inventory: buildInventoryEmbed(items),
    shop: buildShopCatalogEmbed(Object.values(SHOP_CATALOG)),
    info: buildEcoInfoEmbed(),
  }[tab];

  return { embeds: [embeds], components: buildEconomyHubRows() };
}
