import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { customId, visibleMemberHubEntries, type GuildFeatures } from "@sentinel/shared";

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

export function buildSentinelMasterHubRows(features: GuildFeatures): ActionRowBuilder<ButtonBuilder>[] {
  const entries = visibleMemberHubEntries(features);
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < entries.length; i += 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...entries.slice(i, i + 5).map((entry) =>
          new ButtonBuilder()
            .setCustomId(customId(entry.module, entry.action))
            .setLabel(entry.label)
            .setStyle(ButtonStyle[entry.style]),
        ),
      ),
    );
  }
  return rows;
}
