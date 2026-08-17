import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { SHOP_CATALOG } from "@sentinel/shared";

export const buyChoices = Object.entries(SHOP_CATALOG)
  .slice(0, 25)
  .map(([key, e]) => ({ name: `${e.emoji} ${e.label}`.slice(0, 100), value: key }));

export const modPerms =
  PermissionFlagsBits.ModerateMembers |
  PermissionFlagsBits.BanMembers |
  PermissionFlagsBits.KickMembers |
  PermissionFlagsBits.ManageMessages;

export function modCmd(name: string, desc: string) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(desc)
    .setDefaultMemberPermissions(modPerms);
}

export { SlashCommandBuilder, PermissionFlagsBits, ChannelType };
