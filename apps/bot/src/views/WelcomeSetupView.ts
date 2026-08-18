import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from "discord.js";
import { customId } from "@sentinel/shared";

export function buildWelcomeSetupRows(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("welcome", "create"))
        .setLabel("Créer salons welcome")
        .setEmoji("📁")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customId("welcome", "info"))
        .setLabel("Config actuelle")
        .setEmoji("ℹ️")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export const WELCOME_CATEGORY_NAME = "─── COMMUNAUTÉ ───";
export const WELCOME_CHANNEL_NAME = "👋・bienvenue";
export const GOODBYE_CHANNEL_NAME = "👋・départs";

export async function provisionWelcomeChannels(guild: import("discord.js").Guild) {
  let category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === WELCOME_CATEGORY_NAME,
  );
  if (!category) {
    category = await guild.channels.create({
      name: WELCOME_CATEGORY_NAME,
      type: ChannelType.GuildCategory,
      reason: "Mr-X Sentinel welcome setup",
    });
  }
  const perms = [{ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }];
  let welcome = guild.channels.cache.find((c) => c.name === WELCOME_CHANNEL_NAME && c.parentId === category!.id);
  if (!welcome) {
    welcome = await guild.channels.create({
      name: WELCOME_CHANNEL_NAME,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: perms,
      reason: "Mr-X Sentinel welcome",
    });
  }
  let goodbye = guild.channels.cache.find((c) => c.name === GOODBYE_CHANNEL_NAME && c.parentId === category!.id);
  if (!goodbye) {
    goodbye = await guild.channels.create({
      name: GOODBYE_CHANNEL_NAME,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: perms,
      reason: "Mr-X Sentinel goodbye",
    });
  }
  return { welcomeChannelId: welcome.id, goodbyeChannelId: goodbye.id };
}
