import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "./shared.js";

export const levelsCommands = [
  new SlashCommandBuilder()
    .setName("rank").setDescription("Voir ton niveau XP"),

  new SlashCommandBuilder().setName("lvl_info").setDescription("Fonctionnement du système de niveaux"),

  new SlashCommandBuilder()
    .setName("setlevelchannel")
    .setDescription("[Owner] Salon des annonces level-up")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("removelevelchannel")
    .setDescription("[Owner] Retirer le salon level-up")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("levelsinfo")
    .setDescription("[Owner] Configuration des niveaux")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("levels")
    .setDescription("[Owner] Réglages niveaux")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("roles")
        .setDescription("Rôles référence pour récompenses level")
        .addRoleOption((o) => o.setName("reference_role").setDescription("Rôle référence"))
        .addRoleOption((o) => o.setName("bot_role").setDescription("Rôle du bot")),
    ),
];
