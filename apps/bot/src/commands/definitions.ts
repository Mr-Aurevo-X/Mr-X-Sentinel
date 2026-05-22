import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";

const modPerms = PermissionFlagsBits.ModerateMembers | PermissionFlagsBits.BanMembers;

function modCmd(name: string, desc: string) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(desc)
    .setDefaultMemberPermissions(modPerms);
}

export const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configurer Mr-X Sentinel sur ce serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o.setName("create_logs").setDescription("Créer les salons de logs automatiquement").setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("fonctionnement")
    .setDescription("[Owner] Guide complet du bot sur ce serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o.setName("public").setDescription("Publier dans le salon (owner uniquement)").setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Panneau des salons de logs")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("panel").setDescription("Ouvrir le panneau"))
    .addSubcommand((s) => s.setName("create").setDescription("Créer tous les salons de logs")),

  new SlashCommandBuilder()
    .setName("sentinel")
    .setDescription("Menu principal — économie, fun, tickets")
    .addSubcommand((s) => s.setName("menu").setDescription("Ouvrir le hub")),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("[Staff] Panneau modération et outils")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  modCmd("ban", "Bannir un membre")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true))
    .addIntegerOption((o) => o.setName("delete_days").setMinValue(0).setMaxValue(7)),

  modCmd("unban", "Débannir").addStringOption((o) => o.setName("user_id").setRequired(true)),

  modCmd("kick", "Expulser un membre")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true)),

  modCmd("mute", "Mute (timeout)")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true))
    .addIntegerOption((o) => o.setName("minutes").setRequired(true).setMinValue(1).setMaxValue(40320)),

  modCmd("unmute", "Retirer le mute").addUserOption((o) => o.setName("user").setRequired(true)),

  modCmd("warn", "Avertir")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true)),

  modCmd("warnings", "Voir les avertissements").addUserOption((o) => o.setName("user").setRequired(true)),

  modCmd("clear", "Supprimer des messages")
    .addIntegerOption((o) => o.setName("amount").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName("user").setRequired(false)),

  modCmd("nuke", "Supprimer tous les messages du salon")
    .addChannelOption((o) =>
      o.setName("channel").addChannelTypes(ChannelType.GuildText).setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("security")
    .setDescription("Gestion sécurité")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("status").setDescription("État"))
    .addSubcommand((s) => s.setName("lockdown").setDescription("Lockdown"))
    .addSubcommand((s) => s.setName("unlock").setDescription("Unlock")),

  new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Snapshots")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("create").setDescription("Créer"))
    .addSubcommand((s) => s.setName("list").setDescription("Lister"))
    .addSubcommand((s) =>
      s.setName("restore").addStringOption((o) => o.setName("id").setRequired(true)),
    ),

  new SlashCommandBuilder()
    .setName("rank").setDescription("Voir ton niveau XP"),

  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Discuter avec l'IA")
    .addSubcommand((s) =>
      s.setName("message").addStringOption((o) => o.setName("prompt").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("reset").setDescription("Réinitialiser la conversation")),

  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Lire de la musique")
    .addStringOption((o) => o.setName("query").setDescription("URL ou recherche").setRequired(true)),

  new SlashCommandBuilder().setName("help").setDescription("Aide Mr-X Sentinel"),
];
