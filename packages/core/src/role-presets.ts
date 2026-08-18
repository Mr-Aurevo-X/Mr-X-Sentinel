import { PermissionFlagsBits } from "discord.js";

export const ROLE_PRESET_PERMISSIONS: Record<string, bigint> = {
  founder: PermissionFlagsBits.Administrator,
  admin:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.ManageChannels |
    PermissionFlagsBits.ManageRoles |
    PermissionFlagsBits.ManageMessages |
    PermissionFlagsBits.ManageWebhooks |
    PermissionFlagsBits.ManageNicknames |
    PermissionFlagsBits.ViewAuditLog |
    PermissionFlagsBits.KickMembers |
    PermissionFlagsBits.BanMembers |
    PermissionFlagsBits.ModerateMembers,
  moderator:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.ManageMessages |
    PermissionFlagsBits.ManageNicknames |
    PermissionFlagsBits.KickMembers |
    PermissionFlagsBits.BanMembers |
    PermissionFlagsBits.ModerateMembers |
    PermissionFlagsBits.MuteMembers |
    PermissionFlagsBits.DeafenMembers |
    PermissionFlagsBits.MoveMembers |
    PermissionFlagsBits.ViewAuditLog,
  staff:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.ManageMessages |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.EmbedLinks |
    PermissionFlagsBits.UseExternalEmojis,
  member:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.ChangeNickname |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.EmbedLinks |
    PermissionFlagsBits.UseExternalEmojis,
  visitor:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect,
  muted:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect,
  booster:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.EmbedLinks |
    PermissionFlagsBits.UseExternalEmojis,
  vip:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.EmbedLinks,
  event:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.ManageEvents,
  partner:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak,
  support:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.ManageMessages |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.EmbedLinks,
  creator:
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.Stream |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.EmbedLinks,
};
