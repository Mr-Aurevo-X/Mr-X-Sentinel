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

export type SlashTier = "bot_owner" | "guild_owner" | "admin" | "mod" | "public";

export function tierDesc(tier: SlashTier, text: string): string {
  let prefix: string;
  switch (tier) {
    case "bot_owner":
      prefix = "[Bot owner] ";
      break;
    case "guild_owner":
      prefix = "[Owner] ";
      break;
    case "admin":
      prefix = "[Admin] ";
      break;
    case "mod":
      prefix = "[Staff] ";
      break;
    case "public":
      prefix = "";
      break;
    default: {
      const _exhaustive: never = tier;
      prefix = _exhaustive;
    }
  }
  return (prefix + text).slice(0, 100);
}

export function modCmd(name: string, desc: string) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(tierDesc("mod", desc))
    .setDefaultMemberPermissions(modPerms);
}

export { SlashCommandBuilder, PermissionFlagsBits, ChannelType };
