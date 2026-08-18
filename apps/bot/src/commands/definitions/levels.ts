import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, tierDesc } from "./shared.js";

export const levelsCommands = [
  new SlashCommandBuilder().setName("rank").setDescription(tierDesc("public", "Voir ton niveau XP")),

  new SlashCommandBuilder().setName("lvl_info").setDescription(tierDesc("public", "Fonctionnement du système de niveaux")),

  new SlashCommandBuilder()
    .setName("levels")
    .setDescription(tierDesc("guild_owner", "Réglages niveaux"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("roles")
        .setDescription(tierDesc("guild_owner", "Rôles référence pour récompenses level"))
        .addRoleOption((o) => o.setName("reference_role").setDescription("Rôle référence"))
        .addRoleOption((o) => o.setName("bot_role").setDescription("Rôle du bot")),
    )
    .addSubcommand((s) =>
      s
        .setName("channel")
        .setDescription(tierDesc("guild_owner", "Salon des annonces level-up"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("channel_off").setDescription(tierDesc("guild_owner", "Retirer le salon level-up")))
    .addSubcommand((s) => s.setName("info").setDescription(tierDesc("guild_owner", "Configuration des niveaux"))),
];
