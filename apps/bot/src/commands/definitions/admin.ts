import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "./shared.js";

export const adminCommands = [
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configuration du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("view").setDescription("Voir la config"))
    .addSubcommand((s) =>
      s
        .setName("feature")
        .setDescription("Activer/désactiver un module")
        .addStringOption((o) =>
          o
            .setName("module")
            .setDescription("Module à modifier")
            .setRequired(true)
            .addChoices(
              { name: "Security", value: "security" },
              { name: "Snapshots", value: "snapshots" },
              { name: "Automod", value: "automod" },
              { name: "Moderation", value: "moderation" },
              { name: "Community", value: "community" },
              { name: "Economy", value: "economy" },
              { name: "Levels", value: "levels" },
              { name: "Tickets", value: "tickets" },
              { name: "Templates", value: "templates" },
              { name: "Music", value: "music" },
              { name: "Fun", value: "fun" },
            ),
        )
        .addBooleanOption((o) =>
          o.setName("enabled").setDescription("Activer ou désactiver").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("welcome")
        .setDescription("Salons bienvenue / départ / rôle auto")
        .addChannelOption((o) =>
          o.setName("welcome_channel").setDescription("Salon de bienvenue").addChannelTypes(ChannelType.GuildText),
        )
        .addChannelOption((o) =>
          o.setName("goodbye_channel").setDescription("Salon de départ").addChannelTypes(ChannelType.GuildText),
        )
        .addRoleOption((o) => o.setName("auto_role").setDescription("Rôle auto à l'arrivée")),
    )
    .addSubcommand((s) => s.setName("welcome_panel").setDescription("Panneau setup welcome (créer salons)"))
    .addSubcommand((s) =>
      s
        .setName("economy")
        .setDescription("Réglages économie")
        .addIntegerOption((o) => o.setName("daily_min").setDescription("Daily min").setMinValue(0))
        .addIntegerOption((o) => o.setName("daily_max").setDescription("Daily max").setMinValue(0))
        .addIntegerOption((o) => o.setName("work_min").setDescription("Work min").setMinValue(0))
        .addIntegerOption((o) => o.setName("work_max").setDescription("Work max").setMinValue(0)),
    ),

  new SlashCommandBuilder()
    .setName("template")
    .setDescription("[Owner] Panneau templates serveur (appliquer / reset)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("panel").setDescription("Ouvrir le panneau templates")),

  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Outils administrateur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("announce")
        .setDescription("Annonce embed")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Salon de publication")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((o) => o.setName("title").setDescription("Titre").setRequired(true))
        .addStringOption((o) => o.setName("message").setDescription("Contenu").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("shop_add")
        .setDescription("Ajouter un article boutique")
        .addStringOption((o) => o.setName("name").setDescription("Nom de l'article").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("price").setDescription("Prix en $").setRequired(true).setMinValue(1),
        )
        .addRoleOption((o) => o.setName("role").setDescription("Rôle attribué").setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName("shop_remove")
        .setDescription("Retirer un article boutique")
        .addStringOption((o) => o.setName("item_id").setDescription("ID article").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("panel").setDescription("Panneau admin + mod"))
    .addSubcommand((s) =>
      s
        .setName("roles")
        .setDescription("Rôles mod / ticket")
        .addRoleOption((o) => o.setName("mod_role").setDescription("Rôle modération"))
        .addRoleOption((o) => o.setName("ticket_role").setDescription("Rôle support tickets")),
    ),
];
