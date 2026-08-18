import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import { customId } from "@sentinel/shared";
import { getGuildConfig, prisma, updateGuildConfig } from "@sentinel/database";
import { BRAND_COLOR, isGuildFeatureKey, type GuildFeatures } from "@sentinel/shared";
import { buildConfigViewEmbed, buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";
import { handleAdminShopAdd, handleAdminShopRemove } from "./tickets.js";
import {
  handleAdminPanel,
  handleAdminRoles,
  handleRemovespam,
  handleSetcounter,
  handleSeterrorlog,
  handleSetspam,
} from "./extended.js";
import { buildWelcomeSetupRows } from "../../views/WelcomeSetupView.js";

export async function handleConfig(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "view") {
    const cfg = await getGuildConfig(guildId);
    return { embeds: [buildConfigViewEmbed(cfg.features)] };
  }
  if (sub === "welcome") {
    const cfg = await getGuildConfig(guildId);
    const welcomeCh = interaction.options.getChannel("welcome_channel");
    const goodbyeCh = interaction.options.getChannel("goodbye_channel");
    const autoRole = interaction.options.getRole("auto_role");
    await updateGuildConfig(guildId, {
      welcome: {
        ...cfg.welcome,
        ...(welcomeCh ? { welcomeChannelId: welcomeCh.id } : {}),
        ...(goodbyeCh ? { goodbyeChannelId: goodbyeCh.id } : {}),
        ...(autoRole ? { autoRoleId: autoRole.id } : {}),
      },
    });
    return { embeds: [successEmbed("Welcome", "Configuration bienvenue mise à jour.")] };
  }
  if (sub === "welcome_panel") {
    return {
      embeds: [buildSimpleEmbed("Setup Welcome", "Crée la catégorie **COMMUNAUTÉ** et les salons bienvenue/départs.")],
      components: buildWelcomeSetupRows(),
    };
  }
  if (sub === "economy") {
    const cfg = await getGuildConfig(guildId);
    const patch = { ...cfg.economy };
    const dailyMin = interaction.options.getInteger("daily_min");
    const dailyMax = interaction.options.getInteger("daily_max");
    const workMin = interaction.options.getInteger("work_min");
    const workMax = interaction.options.getInteger("work_max");
    if (dailyMin != null) patch.dailyMin = dailyMin;
    if (dailyMax != null) patch.dailyMax = Math.max(patch.dailyMin, dailyMax);
    if (workMin != null) patch.workMin = workMin;
    if (workMax != null) patch.workMax = Math.max(patch.workMin, workMax);
    if (dailyMin != null || dailyMax != null || workMin != null || workMax != null) {
      await updateGuildConfig(guildId, { economy: patch });
    }
    const e = (await getGuildConfig(guildId)).economy;
    return {
      embeds: [
        buildSimpleEmbed(
          "Réglages économie",
          `Daily : **${e.dailyMin}–${e.dailyMax} $**\nWork : **${e.workMin}–${e.workMax} $**`,
          0xf1c40f,
        ),
      ],
    };
  }
  if (sub === "spam") return handleSetspam(interaction);
  if (sub === "spam_off") return handleRemovespam(interaction);
  if (sub === "counter") return handleSetcounter(interaction);
  if (sub === "errorlog") return handleSeterrorlog(interaction);
  if (sub === "feature") {
    const mod = interaction.options.getString("module", true);
    if (!isGuildFeatureKey(mod)) {
      throw new Error("Module inconnu.");
    }
    const enabled = interaction.options.getBoolean("enabled", true);
    const cfg = await getGuildConfig(guildId);
    await updateGuildConfig(guildId, {
      features: { ...cfg.features, [mod as keyof GuildFeatures]: enabled },
    });
    return {
      embeds: [successEmbed("Module mis à jour", `**${mod}** → ${enabled ? "activé" : "désactivé"}.`)],
    };
  }
  throw new Error("Sous-commande inconnue.");
}

export async function handleAdmin(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  if (sub === "announce") {
    const channel = interaction.options.getChannel("channel", true);
    if (channel.type !== ChannelType.GuildText) throw new Error("Salon texte requis.");
    const textCh = channel as TextChannel;
    const title = interaction.options.getString("title", true);
    const message = interaction.options.getString("message", true);
    const embed = new EmbedBuilder().setColor(BRAND_COLOR).setTitle(title).setDescription(message);
    await textCh.send({ embeds: [embed] });
    return { embeds: [successEmbed("Annonce publiée", `Envoyée dans ${textCh.name}.`)] };
  }
  if (sub === "shop_add") return handleAdminShopAdd(interaction);
  if (sub === "shop_remove") return handleAdminShopRemove(interaction);
  if (sub === "panel") {
    return handleAdminPanel(interaction);
  }
  if (sub === "roles") {
    return handleAdminRoles(interaction);
  }
  throw new Error("Sous-commande inconnue.");
}

export async function handleSuggest(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const idea = interaction.options.getString("idea", true);
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Suggestion")
    .setDescription(idea)
    .setFooter({ text: `${interaction.user.tag} · Mr-X Sentinel` });
  if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) {
    const sent = await interaction.channel.send({ embeds: [embed] });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("suggest", "up", sent.id))
        .setLabel("👍 0")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(customId("suggest", "down", sent.id))
        .setLabel("👎 0")
        .setStyle(ButtonStyle.Danger),
    );
    await sent.edit({ components: [row] });
  }
  return { embeds: [successEmbed("Suggestion envoyée", "Merci pour ton idée !")] };
}

export async function handleClearwarn(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const user = interaction.options.getUser("user", true);
  await prisma.guildMemberRecord.upsert({
    where: { guildId_userId: { guildId: interaction.guild!.id, userId: user.id } },
    create: { guildId: interaction.guild!.id, userId: user.id, warnCount: 0 },
    update: { warnCount: 0 },
  });
  return { embeds: [successEmbed("Warns effacés", `Historique réinitialisé pour ${user.tag}.`)] };
}

export async function handleNickname(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const name = interaction.options.getString("name", true);
  await member.setNickname(name, `Par ${interaction.user.tag}`);
  return { embeds: [successEmbed("Pseudo mis à jour", `${member.user.tag} → **${name}**`)] };
}

