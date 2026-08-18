import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getGuildConfig } from "@sentinel/database";
import { dashboardGuildUrl, dashboardPublicUrl, visibleGuildFeatures } from "@sentinel/shared";
import { buildFonctionnementEmbed, buildFonctionnementView } from "../fonctionnement.js";
import { buildLogsPanel } from "../../interactions/logs.js";
import {
  buildHelpEmbed,
  buildPanelEmbed,
  buildSentinelMasterHubEmbed,
  buildSimpleEmbed,
  successEmbed,
} from "../../ui/embeds.js";
import { buildSentinelMasterHubRows } from "../../views/HubViews.js";
import { buildHelpTierRows } from "../../views/HelpView.js";
import { buildModerationPanelRows } from "../../views/ModerationViews.js";
import { logProvisioningService } from "@sentinel/core";
import type { CommandReply } from "../middleware.js";

export async function handleFonctionnement(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const features = (await getGuildConfig(interaction.guild!.id)).features;
  return {
    embeds: [buildFonctionnementEmbed(features)],
    components: buildFonctionnementView(features),
  };
}

export async function handleDashboard(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const guild = interaction.guild!;
  const url = dashboardGuildUrl(guild.id);
  return {
    embeds: [
      buildSimpleEmbed(
        "Dashboard",
        `Panneau web de **${guild.name}**.\n[Ouvrir le dashboard](${url})`,
      ),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Ouvrir le dashboard").setURL(url),
      ),
    ],
  };
}

export async function handleLogs(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  if (sub === "create") {
    const channels = await logProvisioningService.provisionAll(interaction.guild!);
    return {
      embeds: [successEmbed("Logs créés", `${Object.keys(channels).length} salons configurés.`)],
    };
  }
  return {
    embeds: [buildSimpleEmbed("Logs Sentinel", "10 types de logs — catégorie **Logs Sentinel**.")],
    components: buildLogsPanel(),
  };
}

export async function handleSentinel(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const guild = interaction.guild!;
  if (interaction.options.getSubcommand() === "about") {
    return {
      embeds: [
        buildSimpleEmbed(
          "À propos de Mr-X Sentinel",
          [
            "Plateforme Discord unifiée : sécurité, modération, logs, économie, XP, tickets et musique.",
            "Modules activables par serveur via `/config feature`.",
            "",
            "Open source (Apache-2.0) : https://github.com/Mr-Aurevo-X/Mr-X-Sentinel",
            `Dashboard : ${dashboardPublicUrl()} (\`pnpm dev:dashboard\` ou \`pnpm dev\`)`,
            "Hub principal : `/sentinel menu` · Aide : `/help`",
          ].join("\n"),
        ),
      ],
    };
  }
  const cfg = await getGuildConfig(guild.id);
  const visible = visibleGuildFeatures(cfg.features);
  const on = visible.filter(([, enabled]) => enabled).length;
  const banner = process.env.BRAND_BANNER_URL ?? null;
  return {
    embeds: [buildSentinelMasterHubEmbed(guild.name, guild.memberCount, on, visible.length, banner)],
    components: buildSentinelMasterHubRows(cfg.features),
  };
}

export async function handlePanel(): Promise<CommandReply> {
  return { embeds: [buildPanelEmbed()], components: buildModerationPanelRows() };
}

export async function handleHelp(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const features = (await getGuildConfig(interaction.guild!.id)).features;
  return { embeds: [buildHelpEmbed("public", features)], components: buildHelpTierRows() };
}
