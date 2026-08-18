import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { customId } from "@sentinel/shared";

export function buildEconomyHubRows(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId("eco", "home")).setLabel("Accueil").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(customId("eco", "bank")).setLabel("Banque").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("eco", "inventory")).setLabel("Inventaire").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("eco", "shop")).setLabel("Shop").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("eco", "info")).setLabel("Info").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export function buildGambleHubRows(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId("fun", "coinflip")).setLabel("🪙 Pile/Face").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(customId("fun", "slots")).setLabel("🎰 Slots").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("fun", "roulette")).setLabel("🎡 Roulette").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("fun", "blackjack")).setLabel("🃏 Blackjack").setStyle(ButtonStyle.Success),
    ),
  ];
}

export function buildMinijeuxHubRows(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId("minijeu", "rps")).setLabel("✊ RPS").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(customId("minijeu", "dice")).setLabel("🎲 Dé").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("minijeu", "guess")).setLabel("🔢 Devine").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export function buildSentinelMasterHubRows(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId("sentinel", "eco")).setLabel("💰 Économie").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(customId("sentinel", "gamble")).setLabel("🎰 Casino").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("sentinel", "rank")).setLabel("📊 Mon XP").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("economy", "daily")).setLabel("🎁 Daily").setStyle(ButtonStyle.Success),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId("economy", "work")).setLabel("💼 Travail").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("fun", "slots")).setLabel("🎰 Slots").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(customId("ticket", "open")).setLabel("🎫 Ticket").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(customId("sentinel", "help")).setLabel("❓ Aide").setStyle(ButtonStyle.Secondary),
    ),
  ];
}
