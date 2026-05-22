/** Discord permission flag bits (discord-api-types v10) */
const P = {
  CreateInstantInvite: 1n << 0n,
  KickMembers: 1n << 1n,
  BanMembers: 1n << 2n,
  Administrator: 1n << 3n,
  ManageChannels: 1n << 4n,
  ManageGuild: 1n << 5n,
  MentionEveryone: 1n << 13n,
  ManageRoles: 1n << 28n,
  ManageWebhooks: 1n << 29n,
  ManageEmojisAndStickers: 1n << 30n,
  ModerateMembers: 1n << 40n,
  ViewAuditLog: 1n << 48n,
  SendMessages: 1n << 11n,
  EmbedLinks: 1n << 14n,
  ReadMessageHistory: 1n << 16n,
} as const;

export const BOT_REQUIRED_PERMISSIONS = [
  "ViewAuditLog",
  "ManageRoles",
  "ManageChannels",
  "BanMembers",
  "KickMembers",
  "ModerateMembers",
  "ManageWebhooks",
  "ManageGuild",
  "SendMessages",
  "EmbedLinks",
  "ReadMessageHistory",
] as const;

export const DANGEROUS_PERM_BITS = [
  P.Administrator,
  P.ManageGuild,
  P.ManageRoles,
  P.ManageChannels,
  P.BanMembers,
  P.ManageWebhooks,
  P.MentionEveryone,
] as const;

export function hasDangerousPermissions(permString: bigint | string): boolean {
  const perms = BigInt(permString);
  return DANGEROUS_PERM_BITS.some((bit) => (perms & bit) === bit);
}
