import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { ownerModifyService } from "@sentinel/core";

export type AccessTier = "public" | "mod" | "admin" | "guild_owner" | "bot_owner";

const MOD_FLAGS =
  PermissionFlagsBits.ModerateMembers |
  PermissionFlagsBits.BanMembers |
  PermissionFlagsBits.KickMembers |
  PermissionFlagsBits.ManageMessages;

type GuildCtx = { guild: { ownerId: string }; user: { id: string } };

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

/** Staff ticket : mod classique ou gestion des salons */
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
    default:
      return "Permission refusée.";
  }
}

export function assertTier(
  ctx: GuildCtx,
  member: GuildMember | null | undefined,
  tier: AccessTier,
): void {
  if (tier === "public") return;
  if (tier === "bot_owner") {
    if (!isBotOwner(ctx.user.id)) throw new Error(denyMessage(tier));
    return;
  }
  if (tier === "guild_owner") {
    if (!isGuildOwner(ctx)) throw new Error(denyMessage(tier));
    return;
  }
  if (tier === "admin") {
    if (!memberHasAdmin(member)) throw new Error(denyMessage(tier));
    return;
  }
  if (tier === "mod") {
    if (!memberHasMod(member)) throw new Error(denyMessage(tier));
  }
}

/** Sous-commandes avec tier différent du parent */
const SUBCOMMAND_TIER: Record<string, AccessTier> = {
  "ticket:open": "public",
  "ticket:setup": "admin",
  "ticket:close": "mod",
  "ticket:claim": "mod",
  "ticket:reopen": "mod",
  "ticket:add": "mod",
  "ticket:remove": "mod",
  "ticket:rename": "mod",
  "ticket:config": "mod",
  "admin:panel": "admin",
  "admin:roles": "admin",
  "brain:analyse": "admin",
  "brain:toggle": "admin",
  "brain:seuil": "admin",
  "levels:roles": "guild_owner",
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
  "config:view": "admin",
  "config:feature": "admin",
  "config:welcome": "admin",
  "config:welcome_panel": "admin",
  "config:economy": "admin",
  "admin:announce": "admin",
  "admin:shop_add": "admin",
  "admin:shop_remove": "admin",
  "owner:balance": "bot_owner",
  "owner:xp": "bot_owner",
  "logs:panel": "admin",
  "logs:create": "admin",
  "security:status": "admin",
  "security:lockdown": "admin",
  "security:unlock": "admin",
  "security:whitelist_add": "admin",
  "security:whitelist_remove": "admin",
  "security:whitelist_list": "admin",
  "automod:panel": "admin",
  "automod:toggle": "admin",
  "automod:words_add": "admin",
  "automod:words_remove": "admin",
  "automod:status": "admin",
  "backup:create": "admin",
  "backup:list": "admin",
  "backup:restore": "admin",
  "template:panel": "guild_owner",
  "sentinel:menu": "public",
  "chat:message": "public",
  "chat:reset": "public",
  "fun:coinflip": "public",
  "fun:slots": "public",
  "fun:roulette": "public",
  "fun:blackjack": "public",
  "shop:list": "public",
  "shop:buy": "public",
  "brain:status": "public",
};

/** Commandes top-level (sans sous-commande ou fallback) */
const COMMAND_TIER: Record<string, AccessTier> = {
  owner: "bot_owner",
  setup: "admin",
  fonctionnement: "guild_owner",
  logs: "admin",
  panel: "mod",
  security: "admin",
  automod: "admin",
  backup: "admin",
  config: "admin",
  admin: "admin",
  template: "guild_owner",
  setlevelchannel: "guild_owner",
  removelevelchannel: "guild_owner",
  levelsinfo: "guild_owner",
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
  eco: "public",
  buy: "public",
  use: "public",
  shop: "public",
  leaderboard: "public",
  fun: "public",
  gamble: "public",
  minijeux: "public",
  chat: "public",
  play: "public",
  suggest: "public",
  brain: "public",
  channel: "mod",
  setspam: "admin",
  removespam: "admin",
  setcounter: "admin",
  levels: "guild_owner",
  stats: "public",
  serverinfo: "public",
  avatar: "public",
  music: "public",
  birthday: "public",
  tempvc: "admin",
  counting: "public",
  afk: "public",
  reminder: "public",
  autosetup: "admin",
  seterrorlog: "admin",
  shadow: "public",
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

export function assertSlashAccess(interaction: ChatInputCommandInteraction): void {
  if (!interaction.guild) throw new Error("Commande utilisable uniquement sur un serveur.");
  const member = interaction.member as GuildMember | null;
  const ctx = interaction as GuildCtx & { guild: { ownerId: string } };

  if (interaction.commandName === "ticket") {
    const sub = interaction.options.getSubcommand(false);
    if (sub && TICKET_MOD_SUBS.has(sub)) {
      if (!memberHasTicketMod(member)) throw new Error(denyMessage("mod"));
      return;
    }
  }

  const tier = resolveSlashTier(interaction);
  assertTier(ctx, member, tier);
}

export function assertComponentAccess(
  interaction: ButtonInteraction | StringSelectMenuInteraction | UserSelectMenuInteraction,
  module: string,
  action: string,
): void {
  if (!interaction.guild) throw new Error("Interaction utilisable uniquement sur un serveur.");
  const ctx = interaction as GuildCtx & { guild: { ownerId: string } };
  const member = interaction.member as GuildMember | null;

  if (module === "fonctionnement") {
    assertTier(ctx, member, "guild_owner");
    return;
  }
  if (module === "template") {
    assertTier(ctx, member, "guild_owner");
    return;
  }
  if (module === "logs" && action === "create") {
    assertTier(ctx, member, "admin");
    return;
  }
  if (module === "welcome") {
    assertTier(ctx, member, "admin");
    return;
  }
  if (module === "mod" || module === "modpanel") {
    assertTier(ctx, member, "mod");
    return;
  }
  if (module === "automod") {
    assertTier(ctx, member, "admin");
    return;
  }
  if (
    module === "ticket" &&
    (action === "close" || action === "claim" || action === "reopen" || action === "add" || action === "remove")
  ) {
    if (!memberHasTicketMod(member)) throw new Error(denyMessage("mod"));
    return;
  }
  if (module === "help") {
    const need = HELP_TIER_MAP[action] ?? "public";
    assertTier(ctx, member, need);
    return;
  }
}

const HELP_TIER_MAP: Record<string, AccessTier> = {
  public: "public",
  staff: "mod",
  owner: "guild_owner",
  bot_owner: "bot_owner",
};
