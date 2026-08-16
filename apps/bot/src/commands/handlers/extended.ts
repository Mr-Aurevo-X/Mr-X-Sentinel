import type { ChatInputCommandInteraction } from "discord.js";
import { type GuildMember, type GuildChannel, type TextChannel } from "discord.js";
import { getGuildConfig, updateGuildConfig, prisma } from "@sentinel/database";
import { buildModerationPanelRows } from "../../views/ModerationViews.js";
import { buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";
import { memberHasAdmin } from "../permissions.js";

export async function handleChannel(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;
  const channel =
    (interaction.options.getChannel("channel") as TextChannel | null) ??
    (guild.channels.cache.get(interaction.channelId) as TextChannel | null);
  if (!channel?.isTextBased()) throw new Error("Salon texte requis.");

  if (sub === "slowmode") {
    const seconds = interaction.options.getInteger("seconds", true);
    await channel.setRateLimitPerUser(seconds, "Panel mod Sentinel");
    return { embeds: [successEmbed("Slowmode", `<#${channel.id}> → **${seconds}s**`)] };
  }
  if (sub === "lock") {
    await channel.permissionOverwrites.edit(guild.id, { SendMessages: false });
    return { embeds: [successEmbed("Salon verrouillé", `<#${channel.id}>`)] };
  }
  if (sub === "unlock") {
    await channel.permissionOverwrites.edit(guild.id, { SendMessages: null });
    return { embeds: [successEmbed("Salon déverrouillé", `<#${channel.id}>`)] };
  }
  throw new Error("Sous-commande inconnue.");
}

export async function handleSetspam(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const channel = interaction.options.getChannel("channel", true);
  const cfg = await getGuildConfig(interaction.guild!.id);
  await updateGuildConfig(interaction.guild!.id, {
    channels: { ...cfg.channels, spamChannelId: channel.id },
  });
  return { embeds: [successEmbed("Spam relay", `Messages relayés vers <#${channel.id}>`)] };
}

export async function handleRemovespam(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const cfg = await getGuildConfig(interaction.guild!.id);
  await updateGuildConfig(interaction.guild!.id, {
    channels: { ...cfg.channels, spamChannelId: null },
  });
  return { embeds: [successEmbed("Spam relay", "Désactivé.")] };
}

export async function handleSetcounter(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const channel = interaction.options.getChannel("channel", true);
  const template = interaction.options.getString("template") ?? "Membres: {count}";
  const cfg = await getGuildConfig(interaction.guild!.id);
  await updateGuildConfig(interaction.guild!.id, {
    channels: { ...cfg.channels, counterChannelId: channel.id, counterTemplate: template },
  });
  const name = template.replace("{count}", String(interaction.guild!.memberCount));
  const guildCh = interaction.guild!.channels.cache.get(channel.id) as GuildChannel | undefined;
  if (guildCh && "setName" in guildCh) {
    await guildCh.setName(name.slice(0, 100)).catch(() => undefined);
  }
  return { embeds: [successEmbed("Compteur", `Salon <#${channel.id}> mis à jour.`)] };
}

export async function handleAdminPanel(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const guild = interaction.guild!;
  const cfg = await getGuildConfig(guild.id);
  return {
    embeds: [
      buildSimpleEmbed(
        "Panel administrateur",
        [
          `Membres : **${guild.memberCount}**`,
          `Salons : **${guild.channels.cache.size}**`,
          `Rôles mod : ${cfg.staff.modRoleIds.map((id) => `<@&${id}>`).join(" ") || "—"}`,
          `Support tickets : ${cfg.tickets.supportRoleIds.map((id) => `<@&${id}>`).join(" ") || "—"}`,
        ].join("\n"),
      ),
    ],
    components: buildModerationPanelRows(),
  };
}

export async function handleAdminRoles(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  const modRole = interaction.options.getRole("mod_role");
  const ticketRole = interaction.options.getRole("ticket_role");
  const cfg = await getGuildConfig(interaction.guild!.id);
  await updateGuildConfig(interaction.guild!.id, {
    staff: {
      modRoleIds: modRole ? [modRole.id] : cfg.staff.modRoleIds,
    },
    tickets: {
      ...cfg.tickets,
      supportRoleIds: ticketRole ? [ticketRole.id] : cfg.tickets.supportRoleIds,
    },
  });
  return { embeds: [successEmbed("Rôles système", "Configuration staff mise à jour.")] };
}

export async function handleLevelsRoles(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  if (interaction.guild!.ownerId !== interaction.user.id) {
    throw new Error("Réservé au propriétaire du serveur.");
  }
  const cfg = await getGuildConfig(interaction.guild!.id);
  const ref = interaction.options.getRole("reference_role");
  const botRole = interaction.options.getRole("bot_role");
  await updateGuildConfig(interaction.guild!.id, {
    levels: {
      ...cfg.levels,
      ...(ref ? { referenceRoleId: ref.id } : {}),
      ...(botRole ? { botRoleId: botRole.id } : {}),
    },
  });
  return {
    embeds: [
      successEmbed(
        "Rôles niveaux",
        `Référence : ${ref ? ref.name : "—"} · Bot : ${botRole ? botRole.name : "—"}`,
      ),
    ],
  };
}

export async function handleAfk(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const userId = interaction.user.id;

  if (sub === "set") {
    const reason = interaction.options.getString("reason", true);
    await prisma.afkStatus.upsert({
      where: { guildId_userId: { guildId, userId } },
      create: { guildId, userId, reason },
      update: { reason },
    });
    return { embeds: [successEmbed("AFK", `Statut : ${reason}`)] };
  }

  await prisma.afkStatus.deleteMany({ where: { guildId, userId } });
  return { embeds: [successEmbed("AFK", "Statut retiré.")] };
}

export async function handleReminder(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const message = interaction.options.getString("message", true);
  const minutes = interaction.options.getInteger("minutes", true);
  const dueAt = new Date(Date.now() + minutes * 60_000);
  await prisma.reminder.create({
    data: {
      guildId: interaction.guild!.id,
      userId: interaction.user.id,
      channelId: interaction.channelId,
      message,
      dueAt,
    },
  });
  return {
    embeds: [successEmbed("Rappel", `Dans **${minutes}** min : ${message.slice(0, 100)}`)],
  };
}

export async function handleAutosetup(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
): Promise<CommandReply> {
  if (!memberHasAdmin(interaction.member as GuildMember)) {
    throw new Error("Administrateur requis.");
  }
  const { logProvisioningService, templateService } = await import("@sentinel/core");
  const guild = interaction.guild!;
  const templateKey = interaction.options.getString("template") ?? "gaming";
  await templateService.apply(guild, templateKey, client, interaction.user.id, { createLogs: true });
  await logProvisioningService.provisionAll(guild, interaction.user.id);
  return {
    embeds: [
      successEmbed(
        "Autosetup",
        `Template **${templateKey}** + logs créés. Lance **/fonctionnement** pour le guide.`,
      ),
    ],
  };
}

export async function handleSeterrorlog(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const channel = interaction.options.getChannel("channel", true);
  await updateGuildConfig(interaction.guild!.id, { modLogChannelId: channel.id });
  return { embeds: [successEmbed("Logs erreurs", `Alertes → <#${channel.id}>`)] };
}

export async function handleShadow(): Promise<CommandReply> {
  return {
    embeds: [
      buildSimpleEmbed(
        "Shadow",
        "« Dans l'ombre, Sentinel veille. »\n— Mr-X Sentinel, fusion des bots legacy.",
        0x2f3136,
      ),
    ],
  };
}
