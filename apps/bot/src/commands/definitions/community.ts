import { CUSTOM_COMMAND_BODY_MAX, CUSTOM_COMMAND_DESC_MAX } from "@sentinel/shared";
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, tierDesc } from "./shared.js";

export const communityCommands = [
  new SlashCommandBuilder()
    .setName("suggest")
    .setDescription(tierDesc("public", "Envoyer une suggestion"))
    .addStringOption((o) => o.setName("idea").setDescription("Votre idée").setRequired(true)),

  new SlashCommandBuilder()
    .setName("poll")
    .setDescription(tierDesc("admin", "Sondages"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription(tierDesc("admin", "Créer un sondage"))
        .addStringOption((o) => o.setName("question").setDescription("Question").setRequired(true))
        .addStringOption((o) => o.setName("option1").setDescription("Option 1").setRequired(true))
        .addStringOption((o) => o.setName("option2").setDescription("Option 2").setRequired(true))
        .addStringOption((o) => o.setName("option3").setDescription("Option 3"))
        .addStringOption((o) => o.setName("option4").setDescription("Option 4"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText),
        )
        .addIntegerOption((o) =>
          o.setName("duration_hours").setDescription("Durée en heures").setMinValue(1).setMaxValue(168),
        ),
    )
    .addSubcommand((s) => s.setName("list").setDescription(tierDesc("admin", "Lister les sondages"))),

  new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription(tierDesc("admin", "Giveaways"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription(tierDesc("admin", "Lancer un giveaway"))
        .addStringOption((o) => o.setName("prize").setDescription("Prix").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("duration_hours").setDescription("Durée en heures").setRequired(true).setMinValue(1).setMaxValue(168),
        )
        .addIntegerOption((o) => o.setName("winners").setDescription("Nombre de gagnants").setMinValue(1).setMaxValue(10))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("end")
        .setDescription(tierDesc("admin", "Terminer un giveaway"))
        .addStringOption((o) => o.setName("id").setDescription("ID du giveaway").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription(tierDesc("admin", "Giveaways actifs"))),

  new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription(tierDesc("admin", "Reaction roles"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription(tierDesc("admin", "Ajouter une reaction role"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText).setRequired(true),
        )
        .addStringOption((o) => o.setName("message_id").setDescription("ID du message").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Rôle").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription(tierDesc("admin", "Retirer une reaction role"))
        .addStringOption((o) => o.setName("message_id").setDescription("ID du message").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription(tierDesc("admin", "Lister les reaction roles"))),

  new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Anniversaires")
    .addSubcommand((s) =>
      s
        .setName("set")
        .setDescription(tierDesc("public", "Enregistrer ton anniversaire"))
        .addIntegerOption((o) =>
          o.setName("day").setDescription("Jour 1-31").setRequired(true).setMinValue(1).setMaxValue(31),
        )
        .addIntegerOption((o) =>
          o.setName("month").setDescription("Mois 1-12").setRequired(true).setMinValue(1).setMaxValue(12),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("channel")
        .setDescription(tierDesc("guild_owner", "Salon des annonces"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("remove").setDescription(tierDesc("public", "Supprimer ton anniversaire"))),

  new SlashCommandBuilder()
    .setName("tempvc")
    .setDescription(tierDesc("guild_owner", "Salons vocaux temporaires"))
    .addSubcommand((s) =>
      s
        .setName("hub")
        .setDescription(tierDesc("guild_owner", "Définir le salon générateur"))
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Salon vocal hub")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("off").setDescription(tierDesc("guild_owner", "Désactiver temp VC"))),

  new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Jeu du compteur")
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription(tierDesc("guild_owner", "Salon du compteur"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("off").setDescription(tierDesc("guild_owner", "Désactiver")))
    .addSubcommand((s) => s.setName("status").setDescription(tierDesc("public", "Voir le score"))),

  new SlashCommandBuilder()
    .setName("starboard")
    .setDescription(tierDesc("admin", "Starboard"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription(tierDesc("guild_owner", "Activer le starboard"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText).setRequired(true),
        )
        .addIntegerOption((o) =>
          o.setName("threshold").setDescription("Nombre de ⭐").setMinValue(1).setMaxValue(50),
        ),
    )
    .addSubcommand((s) => s.setName("off").setDescription(tierDesc("guild_owner", "Désactiver")))
    .addSubcommand((s) => s.setName("status").setDescription(tierDesc("admin", "Voir la config"))),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription(tierDesc("guild_owner", "Vérification des membres"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription(tierDesc("guild_owner", "Configurer la vérification"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon du bouton").addChannelTypes(ChannelType.GuildText).setRequired(true),
        )
        .addRoleOption((o) => o.setName("verified").setDescription("Rôle vérifié").setRequired(true))
        .addRoleOption((o) => o.setName("unverified").setDescription("Rôle avant vérif")),
    )
    .addSubcommand((s) => s.setName("panel").setDescription(tierDesc("guild_owner", "Publier le bouton de vérification")))
    .addSubcommand((s) => s.setName("off").setDescription(tierDesc("guild_owner", "Désactiver"))),

  new SlashCommandBuilder()
    .setName("addcommand")
    .setDescription(tierDesc("mod", "Créer ou modifier une commande perso"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName("name")
        .setDescription("Nom de la commande (a-z, 0-9, _ ou -)")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(32),
    )
    .addStringOption((o) =>
      o
        .setName("texte")
        .setDescription("Texte renvoyé par la commande")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(CUSTOM_COMMAND_BODY_MAX),
    )
    .addStringOption((o) =>
      o
        .setName("description")
        .setDescription("Description Discord (optionnel)")
        .setMaxLength(CUSTOM_COMMAND_DESC_MAX),
    ),

  new SlashCommandBuilder()
    .setName("removecommand")
    .setDescription(tierDesc("mod", "Supprimer une commande perso"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName("name")
        .setDescription("Nom de la commande")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(32),
    ),

  new SlashCommandBuilder()
    .setName("listcommands")
    .setDescription(tierDesc("public", "Lister les commandes personnalisées")),
];
