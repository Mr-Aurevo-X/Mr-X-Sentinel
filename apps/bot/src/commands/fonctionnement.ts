import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type ActionRowBuilder as AR,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { customId } from "@sentinel/shared";
import { BRAND_COLOR, type GuildFeatures } from "@sentinel/shared";
import {
  sectionContent,
  visibleSections,
  SECTION_LABELS,
  type FonctionnementSection,
} from "@sentinel/core";

export function buildFonctionnementView(
  features: GuildFeatures,
  current: FonctionnementSection = "demarrage",
): AR<MessageActionRowComponentBuilder>[] {
  const sections = visibleSections(features);
  const select = new StringSelectMenuBuilder()
    .setCustomId("sentinel:fonctionnement:section")
    .setPlaceholder("Choisir une section")
    .addOptions(
      sections.map((s) => ({
        label: SECTION_LABELS[s],
        value: s,
        default: s === current,
      })),
    );

  const rows: AR<MessageActionRowComponentBuilder>[] = [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select),
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("logs", "create"))
        .setLabel("Créer salons logs")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(customId("onboarding", "setup_hint"))
        .setLabel("Voir /setup")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    ),
  ];
  return rows;
}

export function buildFonctionnementEmbed(
  features: GuildFeatures,
  section: FonctionnementSection = "demarrage",
): EmbedBuilder {
  const { title, body } = sectionContent(section, features);
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(`Mr-X Sentinel — ${title}`)
    .setDescription(body)
    .setFooter({ text: "Commande réservée au propriétaire du serveur" });
}
