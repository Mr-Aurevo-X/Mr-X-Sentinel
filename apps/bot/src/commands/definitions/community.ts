import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "./shared.js";

export const communityCommands = [
  new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Envoyer une suggestion")
    .addStringOption((o) => o.setName("idea").setDescription("Votre idée").setRequired(true)),

  new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Sondages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("Créer un sondage")
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
    .addSubcommand((s) => s.setName("list").setDescription("Lister les sondages")),

  new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Giveaways")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("Lancer un giveaway")
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
        .setDescription("Terminer un giveaway")
        .addStringOption((o) => o.setName("id").setDescription("ID du giveaway").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("Giveaways actifs")),

  new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Reaction roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Ajouter une reaction role")
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
        .setDescription("Retirer une reaction role")
        .addStringOption((o) => o.setName("message_id").setDescription("ID du message").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("Lister les reaction roles")),

  new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Anniversaires")
    .addSubcommand((s) =>
      s
        .setName("set")
        .setDescription("Enregistrer ton anniversaire")
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
        .setDescription("[Admin] Salon des annonces")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("remove").setDescription("Supprimer ton anniversaire")),

  new SlashCommandBuilder()
    .setName("tempvc")
    .setDescription("Salons vocaux temporaires")
    .addSubcommand((s) =>
      s
        .setName("hub")
        .setDescription("[Admin] Définir le salon générateur")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Salon vocal hub")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("off").setDescription("[Admin] Désactiver temp VC")),

  new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Jeu du compteur")
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription("[Admin] Salon du compteur")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("off").setDescription("[Admin] Désactiver"))
    .addSubcommand((s) => s.setName("status").setDescription("Voir le score")),
];
