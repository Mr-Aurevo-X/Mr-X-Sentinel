import type { ChatInputCommandInteraction } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import { customId } from "@sentinel/shared";
import { getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { BRAND_COLOR, type GuildFeatures } from "@sentinel/shared";
import { buildBrainStatusEmbed, buildConfigViewEmbed, buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";
import { handleAdminShopAdd, handleAdminShopRemove } from "./tickets.js";

const BRAIN_URL = process.env.BRAIN_URL ?? "http://127.0.0.1:8765";

export async function handleConfig(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "view") {
    const cfg = await getGuildConfig(guildId);
    return { embeds: [buildConfigViewEmbed(cfg.features as Record<string, boolean>)] };
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
    const { buildWelcomeSetupRows } = await import("../../views/WelcomeSetupView.js");
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
  const mod = interaction.options.getString("module", true) as keyof GuildFeatures;
  const enabled = interaction.options.getBoolean("enabled", true);
  const cfg = await getGuildConfig(guildId);
  await updateGuildConfig(guildId, {
    features: { ...cfg.features, [mod]: enabled },
  });
  return {
    embeds: [successEmbed("Module mis à jour", `**${mod}** → ${enabled ? "activé" : "désactivé"}.`)],
  };
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
    const { handleAdminPanel } = await import("./extended.js");
    return handleAdminPanel(interaction);
  }
  if (sub === "roles") {
    const { handleAdminRoles } = await import("./extended.js");
    return handleAdminRoles(interaction);
  }
  throw new Error("Sous-commande inconnue.");
}

export async function handleBrain(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  if (sub !== "status") {
    const { handleBrainExtended } = await import("./extended.js");
    return handleBrainExtended(interaction);
  }
  try {
    const res = await fetch(`${BRAIN_URL}/status`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      return { embeds: [buildBrainStatusEmbed({ online: false })] };
    }
    const data = (await res.json()) as { samples?: number; ready?: boolean; spam?: number; toxicity?: number };
    return {
      embeds: [
        buildBrainStatusEmbed({
          online: true,
          samples: data.samples,
          ready: data.ready,
          spam: data.spam,
          toxicity: data.toxicity,
        }),
      ],
    };
  } catch {
    return { embeds: [buildBrainStatusEmbed({ online: false })] };
  }
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
  const { prisma } = await import("@sentinel/database");
  await prisma.guildMemberRecord.upsert({
    where: { guildId_userId: { guildId: interaction.guild!.id, userId: user.id } },
    create: { guildId: interaction.guild!.id, userId: user.id, warnCount: 0 },
    update: { warnCount: 0 },
  });
  return { embeds: [successEmbed("Warns effacés", `Historique réinitialisé pour ${user.tag}.`)] };
}

export async function handleNickname(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const member = interaction.options.getMember("user") as import("discord.js").GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const name = interaction.options.getString("name", true);
  await member.setNickname(name, `Par ${interaction.user.tag}`);
  return { embeds: [successEmbed("Pseudo mis à jour", `${member.user.tag} → **${name}**`)] };
}

export async function handlePlayMusic(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
): Promise<CommandReply> {
  const member = interaction.member as import("discord.js").GuildMember;
  const voice = member.voice.channel;
  if (!voice) throw new Error("Rejoins un salon vocal d'abord.");
  const query = interaction.options.getString("query", true);
  const { musicManager } = await import("../../music/MusicManager.js");
  const { embed } = await musicManager.play(client, voice, query, interaction.user.id, interaction.channelId);
  return {
    embeds: [embed],
    components: musicManager.playerControls(interaction.guild!.id),
  };
}
