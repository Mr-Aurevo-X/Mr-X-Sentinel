import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { ownerModifyService } from "@sentinel/core";
import { getGuildConfig } from "@sentinel/database";

export type AccessTier = "public" | "mod" | "admin" | "guild_owner" | "bot_owner";

const MOD_FLAGS =
  PermissionFlagsBits.ModerateMembers |
  PermissionFlagsBits.BanMembers |
  PermissionFlagsBits.KickMembers |
  PermissionFlagsBits.ManageMessages;

type GuildCtx = { guild: { id: string; ownerId: string }; user: { id: string } };

export function isBotOwner(userId: string): boolean {
  return ownerModifyService.isOwner(userId);
}

export function isGuildOwner(ctx: GuildCtx): boolean {
  return ctx.guild.ownerId === ctx.user.id;
}

export function memberHasAdmin(member: GuildMember | null | undefined): boolean {
  if (!member || !("permissions" in member)) return false;
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

export function memberHasMod(member: GuildMember | null | undefined): boolean {
  if (!member || !("permissions" in member)) return false;
  if (memberHasAdmin(member)) return true;
  return member.permissions.any(MOD_FLAGS);
}

function memberHasRole(member: GuildMember | null | undefined, roleIds: string[]): boolean {
  if (!member || !("roles" in member) || roleIds.length === 0) return false;
  return roleIds.some((id) => member.roles.cache.has(id));
}

async function passesMod(ctx: GuildCtx, member: GuildMember | null | undefined): Promise<boolean> {
  if (isGuildOwner(ctx)) return true;
  if (memberHasMod(member)) return true;
  const cfg = await getGuildConfig(ctx.guild.id);
  return memberHasRole(member, cfg.staff.modRoleIds);
}

async function passesTicketStaff(ctx: GuildCtx, member: GuildMember | null | undefined): Promise<boolean> {
  if (await passesMod(ctx, member)) return true;
  if (member && "permissions" in member && member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return true;
  }
  const cfg = await getGuildConfig(ctx.guild.id);
  return memberHasRole(member, cfg.tickets.supportRoleIds);
}

/** Staff ticket : mod, rôle support, ou gestion des salons */
export function memberHasTicketMod(member: GuildMember | null | undefined): boolean {
  if (!member || !("permissions" in member)) return false;
  if (memberHasMod(member)) return true;
  return member.permissions.has(PermissionFlagsBits.ManageChannels);
}

function denyMessage(tier: AccessTier): string {
  switch (tier) {
    case "bot_owner":
      return "Réservé au propriétaire du bot (`BOT_OWNER_ID`).";
    case "guild_owner":
      return "Réservé au propriétaire du serveur.";
    case "admin":
      return "Permission refusée — administrateur ou gérant requis.";
    case "mod":
      return "Permission refusée — modérateur requis.";
    case "public":
      return "Permission refusée.";
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export async function assertTier(
  ctx: GuildCtx,
  member: GuildMember | null | undefined,
  tier: AccessTier,
): Promise<void> {
  switch (tier) {
    case "public":
      return;
    case "bot_owner":
      if (!isBotOwner(ctx.user.id)) throw new Error(denyMessage(tier));
      return;
    case "guild_owner":
      if (!isGuildOwner(ctx)) throw new Error(denyMessage(tier));
      return;
    case "admin":
      if (isGuildOwner(ctx) || memberHasAdmin(member)) return;
      throw new Error(denyMessage(tier));
    case "mod":
      if (await passesMod(ctx, member)) return;
      throw new Error(denyMessage(tier));
    default: {
      const _exhaustive: never = tier;
      throw new Error(denyMessage(_exhaustive));
    }
  }
}

/** Sous-commandes avec tier différent du parent */
const SUBCOMMAND_TIER: Record<string, AccessTier> = {
  "ticket:open": "public",
  "ticket:setup": "guild_owner",
  "ticket:close": "mod",
  "ticket:claim": "mod",
  "ticket:reopen": "mod",
  "ticket:add": "mod",
  "ticket:remove": "mod",
  "ticket:rename": "mod",
  "ticket:config": "mod",
  "admin:panel": "admin",
  "admin:roles": "admin",
  "admin:announce": "admin",
  "admin:shop_add": "admin",
  "admin:shop_remove": "admin",
  "levels:roles": "guild_owner",
  "levels:channel": "guild_owner",
  "levels:channel_off": "guild_owner",
  "levels:info": "guild_owner",
  "afk:set": "public",
  "afk:clear": "public",
  "poll:create": "admin",
  "poll:list": "admin",
  "giveaway:create": "admin",
  "giveaway:end": "admin",
  "giveaway:list": "admin",
  "reactionrole:add": "admin",
  "reactionrole:remove": "admin",
  "reactionrole:list": "admin",
  "starboard:setup": "guild_owner",
  "starboard:off": "guild_owner",
  "starboard:status": "admin",
  "verify:setup": "guild_owner",
  "verify:panel": "guild_owner",
  "verify:off": "guild_owner",
  "config:view": "admin",
  "config:feature": "guild_owner",
  "config:welcome": "guild_owner",
  "config:welcome_panel": "guild_owner",
  "config:economy": "admin",
  "config:spam": "guild_owner",
  "config:spam_off": "guild_owner",
  "config:counter": "guild_owner",
  "config:errorlog": "guild_owner",
  "owner:balance": "bot_owner",
  "owner:xp": "bot_owner",
  "logs:panel": "admin",
  "logs:create": "guild_owner",
  "security:status": "admin",
  "security:lockdown": "admin",
  "security:unlock": "admin",
  "security:whitelist_add": "guild_owner",
  "security:whitelist_remove": "guild_owner",
  "security:whitelist_list": "guild_owner",
  "automod:panel": "admin",
  "automod:toggle": "admin",
  "automod:words_add": "admin",
  "automod:words_remove": "admin",
  "automod:status": "admin",
  "backup:create": "admin",
  "backup:list": "admin",
  "backup:restore": "guild_owner",
  "template:panel": "guild_owner",
  "sentinel:menu": "public",
  "sentinel:about": "public",
  "fun:coinflip": "public",
  "fun:slots": "public",
  "fun:roulette": "public",
  "fun:blackjack": "public",
  "shop:list": "public",
  "shop:buy": "public",
  "shop:catalog": "public",
  "music:play": "public",
  "birthday:set": "public",
  "birthday:remove": "public",
  "birthday:channel": "guild_owner",
  "counting:setup": "guild_owner",
  "counting:off": "guild_owner",
  "counting:status": "public",
  "tempvc:hub": "guild_owner",
  "tempvc:off": "guild_owner",
};

/** Commandes top-level (sans sous-commande ou fallback) */
const COMMAND_TIER: Record<string, AccessTier> = {
  owner: "bot_owner",
  setup: "guild_owner",
  fonctionnement: "guild_owner",
  logs: "admin",
  panel: "mod",
  security: "admin",
  automod: "admin",
  backup: "admin",
  config: "admin",
  admin: "admin",
  template: "guild_owner",
  ban: "mod",
  unban: "mod",
  kick: "mod",
  mute: "mod",
  unmute: "mod",
  warn: "mod",
  warnings: "mod",
  clear: "mod",
  nuke: "mod",
  softban: "mod",
  clearwarn: "mod",
  nickname: "mod",
  poll: "admin",
  giveaway: "admin",
  reactionrole: "admin",
  starboard: "admin",
  verify: "guild_owner",
  ticket: "public",
  rank: "public",
  lvl_info: "public",
  help: "public",
  ping: "public",
  botinfo: "public",
  userinfo: "public",
  sentinel: "public",
  balance: "public",
  pay: "public",
  rob: "public",
  crime: "public",
  deposit: "public",
  withdraw: "public",
  daily: "public",
  weekly: "public",
  monthly: "public",
  work: "public",
  use: "public",
  shop: "public",
  leaderboard: "public",
  fun: "public",
  suggest: "public",
  channel: "mod",
  levels: "guild_owner",
  serverinfo: "public",
  avatar: "public",
  music: "public",
  birthday: "public",
  tempvc: "guild_owner",
  counting: "public",
  afk: "public",
  reminder: "public",
  shadow: "public",
  addcommand: "mod",
  removecommand: "mod",
  listcommands: "public",
};

export function resolveSlashTier(interaction: ChatInputCommandInteraction): AccessTier {
  const name = interaction.commandName;
  const sub = interaction.options.getSubcommand(false);
  if (sub) {
    const key = `${name}:${sub}`;
    if (SUBCOMMAND_TIER[key]) return SUBCOMMAND_TIER[key];
  }
  return COMMAND_TIER[name] ?? "public";
}

const TICKET_MOD_SUBS = new Set(["close", "claim", "reopen", "add", "remove", "rename", "config"]);

export async function assertSlashAccess(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) throw new Error("Commande utilisable uniquement sur un serveur.");
  const member = interaction.member as GuildMember | null;
  const ctx: GuildCtx = { guild: interaction.guild, user: interaction.user };

  if (interaction.commandName === "ticket") {
    const sub = interaction.options.getSubcommand(false);
    if (sub && TICKET_MOD_SUBS.has(sub)) {
      if (!(await passesTicketStaff(ctx, member))) throw new Error(denyMessage("mod"));
      return;
    }
  }

  const tier = resolveSlashTier(interaction);
  await assertTier(ctx, member, tier);
}

export async function assertComponentAccess(
  interaction: ButtonInteraction | StringSelectMenuInteraction | UserSelectMenuInteraction,
  module: string,
  action: string,
): Promise<void> {
  if (!interaction.guild) throw new Error("Interaction utilisable uniquement sur un serveur.");
  const ctx: GuildCtx = { guild: interaction.guild, user: interaction.user };
  const member = interaction.member as GuildMember | null;

  if (module === "fonctionnement") {
    await assertTier(ctx, member, "guild_owner");
    return;
  }
  if (module === "template") {
    await assertTier(ctx, member, "guild_owner");
    return;
  }
  if (module === "logs" && action === "create") {
    await assertTier(ctx, member, "guild_owner");
    return;
  }
  if (module === "welcome") {
    await assertTier(ctx, member, "guild_owner");
    return;
  }
  if (module === "mod" || module === "modpanel") {
    await assertTier(ctx, member, "mod");
    return;
  }
  if (module === "automod") {
    await assertTier(ctx, member, "admin");
    return;
  }
  if (
    module === "ticket" &&
    (action === "close" || action === "claim" || action === "reopen" || action === "add" || action === "remove")
  ) {
    if (!(await passesTicketStaff(ctx, member))) throw new Error(denyMessage("mod"));
    return;
  }
  if (module === "help") {
    const need = HELP_TIER_MAP[action] ?? "public";
    await assertTier(ctx, member, need);
  }
}

const HELP_TIER_MAP: Record<string, AccessTier> = {
  public: "public",
  staff: "mod",
  owner: "guild_owner",
  bot_owner: "bot_owner",
};
