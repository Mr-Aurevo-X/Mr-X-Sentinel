import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, tierDesc } from "./shared.js";

export const adminCommands = [
  new SlashCommandBuilder()
    .setName("config")
    .setDescription(tierDesc("admin", "Configuration du serveur"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("view").setDescription(tierDesc("admin", "Voir la config")))
    .addSubcommand((s) =>
      s
        .setName("feature")
        .setDescription(tierDesc("guild_owner", "Activer/désactiver un module"))
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
        .setDescription(tierDesc("guild_owner", "Salons bienvenue / départ / rôle auto"))
        .addChannelOption((o) =>
          o.setName("welcome_channel").setDescription("Salon de bienvenue").addChannelTypes(ChannelType.GuildText),
        )
        .addChannelOption((o) =>
          o.setName("goodbye_channel").setDescription("Salon de départ").addChannelTypes(ChannelType.GuildText),
        )
        .addRoleOption((o) => o.setName("auto_role").setDescription("Rôle auto à l'arrivée")),
    )
    .addSubcommand((s) =>
      s.setName("welcome_panel").setDescription(tierDesc("guild_owner", "Panneau setup welcome (créer salons)")),
    )
    .addSubcommand((s) =>
      s
        .setName("economy")
        .setDescription(tierDesc("admin", "Réglages économie"))
        .addIntegerOption((o) => o.setName("daily_min").setDescription("Daily min").setMinValue(0))
        .addIntegerOption((o) => o.setName("daily_max").setDescription("Daily max").setMinValue(0))
        .addIntegerOption((o) => o.setName("work_min").setDescription("Work min").setMinValue(0))
        .addIntegerOption((o) => o.setName("work_max").setDescription("Work max").setMinValue(0)),
    )
    .addSubcommand((s) =>
      s
        .setName("spam")
        .setDescription(tierDesc("guild_owner", "Salon relay spam"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("spam_off").setDescription(tierDesc("guild_owner", "Désactiver relay spam")))
    .addSubcommand((s) =>
      s
        .setName("counter")
        .setDescription(tierDesc("guild_owner", "Salon compteur membres"))
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Salon vocal ou texte")
            .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((o) => o.setName("template").setDescription("Ex: Membres: {count}")),
    )
    .addSubcommand((s) =>
      s
        .setName("errorlog")
        .setDescription(tierDesc("guild_owner", "Salon logs erreurs bot"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("template")
    .setDescription(tierDesc("guild_owner", "Panneau templates serveur (appliquer / reset)"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("panel").setDescription(tierDesc("guild_owner", "Ouvrir le panneau templates"))),

  new SlashCommandBuilder()
    .setName("admin")
    .setDescription(tierDesc("admin", "Outils administrateur"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("announce")
        .setDescription(tierDesc("admin", "Annonce embed"))
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
        .setDescription(tierDesc("admin", "Ajouter un article boutique"))
        .addStringOption((o) => o.setName("name").setDescription("Nom de l'article").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("price").setDescription("Prix en $").setRequired(true).setMinValue(1),
        )
        .addRoleOption((o) => o.setName("role").setDescription("Rôle attribué").setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName("shop_remove")
        .setDescription(tierDesc("admin", "Retirer un article boutique"))
        .addStringOption((o) => o.setName("item_id").setDescription("ID article").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("panel").setDescription(tierDesc("admin", "Panneau admin + mod")))
    .addSubcommand((s) =>
      s
        .setName("roles")
        .setDescription(tierDesc("admin", "Rôles mod / ticket"))
        .addRoleOption((o) => o.setName("mod_role").setDescription("Rôle modération"))
        .addRoleOption((o) => o.setName("ticket_role").setDescription("Rôle support tickets")),
    ),
];
