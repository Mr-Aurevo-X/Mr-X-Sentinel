import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type Client,
  type StringSelectMenuInteraction,
} from "discord.js";
import {
  economyService,
  logProvisioningService,
  levelsService,
  funService,
  ticketService,
  sectionContent,
  type FonctionnementSection,
} from "@sentinel/core";
import { customId, parseCustomId, BRAND_COLOR, LOG_TYPES } from "@sentinel/shared";
import { getGuildConfig } from "@sentinel/database";
import type { ModerationService } from "@sentinel/core";
import { buildFonctionnementView } from "./commands/fonctionnement.js";
import { buildTicketRow } from "./commands/extended.js";
import { musicManager } from "./music/MusicManager.js";
import type { GuildMember } from "discord.js";

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

  if (parsed.module === "fun" && parsed.action === "slots") {
    await interaction.deferReply({ ephemeral: true });
    const bet = 50;
    const wallet = await economyService.getOrCreateWallet(interaction.guild.id, interaction.user.id);
    if (wallet.cash < bet) {
      await interaction.editReply({ content: "Pas assez de coins (min 50)." });
      return;
    }
    const r = funService.slots(bet);
    const bal = await funService.applyBet(
      interaction.guild.id,
      interaction.user.id,
      r.payout,
      client,
      "slots",
    );
    await interaction.editReply({
      content: `${r.symbols.join(" ")} → **${r.payout}** | Solde: **${bal}**`,
    });
    return;
  }

  if (parsed.module === "ticket") {
    const member = interaction.member as GuildMember;
    if (parsed.action === "open") {
      await interaction.deferReply({ ephemeral: true });
      try {
        const ch = await ticketService.openTicket(interaction.guild, member, client);
        await interaction.editReply({ content: `Ticket : <#${ch.id}>` });
        await ch.send({
          content: `<@${member.id}> Bienvenue !`,
          components: buildTicketRow(ch.id),
        });
      } catch (e) {
        await interaction.editReply({ content: e instanceof Error ? e.message : "Erreur" });
      }
      return;
    }
    const channelId = parsed.extra ?? interaction.channelId;
    if (parsed.action === "claim") {
      await ticketService.claim(channelId, interaction.user.id, client);
      await interaction.reply({ content: "Ticket pris en charge.", ephemeral: true });
      return;
    }
    if (parsed.action === "close") {
      await interaction.deferReply({ ephemeral: true });
      await ticketService.close(channelId, client);
      await interaction.editReply({ content: "Ticket fermé." });
      return;
    }
  }

  if (parsed.module === "music") {
    const guildId = parsed.extra ?? interaction.guild.id;
    const player = musicManager.getPlayer(guildId);
    if (!player) {
      await interaction.reply({ content: "Aucune lecture en cours.", ephemeral: true });
      return;
    }
    if (parsed.action === "pause") {
      player.pause(!player.paused);
      await interaction.reply({ content: player.paused ? "Pause." : "Reprise.", ephemeral: true });
      return;
    }
    if (parsed.action === "skip") {
      await player.skip();
      await interaction.reply({ content: "Piste suivante.", ephemeral: true });
      return;
    }
    if (parsed.action === "stop") {
      player.destroy();
      await interaction.reply({ content: "Lecture arrêtée.", ephemeral: true });
      return;
    }
    if (parsed.action === "queue") {
      const q = player.queue.map((t) => t.title).slice(0, 10).join("\n") || "(vide)";
      await interaction.reply({ content: `**File :**\n${q}`, ephemeral: true });
    }
    return;
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
      new ButtonBuilder()
        .setCustomId(customId("fun", "slots"))
        .setLabel("Slots (50)")
        .setStyle(ButtonStyle.Success),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("ticket", "open"))
        .setLabel("Ouvrir ticket")
        .setStyle(ButtonStyle.Primary),
    ),
  ];
}

export function buildLogsPanel(): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("sentinel:logs:types")
        .setPlaceholder("Types de logs configurés")
        .addOptions(
          LOG_TYPES.map((t) => ({
            label: t,
            value: t,
            description: `Salon logs-${t.replace("_", "-")}`,
          })),
        )
        .setDisabled(true),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("logs", "create"))
        .setLabel("Créer tous les salons logs")
        .setStyle(ButtonStyle.Success),
    ),
  ];
}
