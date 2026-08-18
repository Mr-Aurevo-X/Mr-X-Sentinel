import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { customId } from "@sentinel/shared";

export type LeaderboardTab = "economy" | "levels" | "global";

export function buildLeaderboardView(
  tab: LeaderboardTab,
  page: number,
  maxPages: number,
  _ecoRows: unknown[],
  _levelRows: unknown[],
  _globalRows: unknown[] = [],
): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("lb", "economy", String(page)))
        .setLabel("Économie")
        .setStyle(tab === "economy" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(customId("lb", "levels", String(page)))
        .setLabel("Niveaux")
        .setStyle(tab === "levels" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(customId("lb", "global", String(page)))
        .setLabel("Global")
        .setStyle(tab === "global" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("lb", "prev", `${tab}:${page}`))
        .setLabel("◀ Prev")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(customId("lb", "next", `${tab}:${page}`))
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= maxPages),
    ),
  ];
}
