import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ButtonInteraction,
  type Client,
  type StringSelectMenuInteraction,
} from "discord.js";
import {
  economyService,
  logProvisioningService,
  levelsService,
  sectionContent,
  type FonctionnementSection,
} from "@sentinel/core";
import { customId, parseCustomId, BRAND_COLOR } from "@sentinel/shared";
import { getGuildConfig } from "@sentinel/database";
import type { ModerationService } from "@sentinel/core";
import { buildFonctionnementView } from "./commands/fonctionnement.js";

export async function handleComponent(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  client: Client,
  _moderation: ModerationService,
): Promise<void> {
  if (!interaction.guild) return;

  if (interaction.isStringSelectMenu() && interaction.customId === "sentinel:fonctionnement:section") {
    if (interaction.guild.ownerId !== interaction.user.id) {
      await interaction.reply({ content: "Réservé au propriétaire du serveur.", ephemeral: true });
      return;
    }
    const section = interaction.values[0] as FonctionnementSection;
    const features = (await getGuildConfig(interaction.guild.id)).features;
    const { title, body } = sectionContent(section, features);
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle(`Mr-X Sentinel — ${title}`)
      .setDescription(body);
    await interaction.update({
      embeds: [embed],
      components: buildFonctionnementView(features, section),
    });
    return;
  }

  const parsed = parseCustomId(interaction.customId);
  if (!parsed) return;

  if (parsed.module === "economy") {
    if (parsed.action === "daily") {
      await interaction.deferReply({ ephemeral: true });
      try {
        const { reward } = await economyService.daily(interaction.guild.id, interaction.user.id);
        await economyService.logEconomy(
          client,
          interaction.guild.id,
          "Daily",
          `<@${interaction.user.id}> a reçu **${reward}** coins.`,
          interaction.user.id,
        );
        await interaction.editReply({ content: `Daily : +**${reward}** coins.` });
      } catch (e) {
        await interaction.editReply({
          content: e instanceof Error ? e.message : "Erreur",
        });
      }
      return;
    }
    if (parsed.action === "work") {
      await interaction.deferReply({ ephemeral: true });
      try {
        const { reward } = await economyService.work(interaction.guild.id, interaction.user.id);
        await economyService.logEconomy(
          client,
          interaction.guild.id,
          "Work",
          `<@${interaction.user.id}> a gagné **${reward}** coins.`,
          interaction.user.id,
        );
        await interaction.editReply({ content: `Travail : +**${reward}** coins.` });
      } catch (e) {
        await interaction.editReply({
          content: e instanceof Error ? e.message : "Erreur",
        });
      }
      return;
    }
  }

  if (parsed.module === "logs" && parsed.action === "create") {
    if (interaction.guild.ownerId !== interaction.user.id) {
      await interaction.reply({ content: "Réservé au propriétaire.", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      const channels = await logProvisioningService.provisionAll(interaction.guild);
      await interaction.editReply({
        content: `Salons créés : ${Object.keys(channels).length} types configurés.`,
      });
    } catch (e) {
      await interaction.editReply({
        content: e instanceof Error ? e.message : "Erreur création logs",
      });
    }
    return;
  }

  if (parsed.module === "sentinel" && parsed.action === "rank") {
    await interaction.deferReply({ ephemeral: true });
    const xp = await levelsService.getOrCreate(interaction.guild.id, interaction.user.id);
    await interaction.editReply({
      content: `Niveau **${xp.level}** — ${xp.xp} XP`,
    });
  }
}

export function buildSentinelHub(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("economy", "daily"))
        .setLabel("Daily")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customId("economy", "work"))
        .setLabel("Travail")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(customId("sentinel", "rank"))
        .setLabel("Mon XP")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}
