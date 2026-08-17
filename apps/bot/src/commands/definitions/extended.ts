import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, modPerms } from "./shared.js";

export const extendedCommands = [
  new SlashCommandBuilder()
    .setName("channel")
    .setDescription("[Mod] Gestion salon")
    .setDefaultMemberPermissions(modPerms)
    .addSubcommand((s) =>
      s
        .setName("slowmode")
        .setDescription("Slowmode")
        .addIntegerOption((o) =>
          o.setName("seconds").setDescription("Secondes").setRequired(true).setMinValue(0).setMaxValue(21600),
        )
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("lock")
        .setDescription("Verrouiller un salon")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("unlock")
        .setDescription("Déverrouiller un salon")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText),
        ),
    ),

  new SlashCommandBuilder()
    .setName("setspam")
    .setDescription("[Admin] Salon relay spam")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText).setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("removespam")
    .setDescription("[Admin] Désactiver relay spam")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("setcounter")
    .setDescription("[Admin] Salon compteur membres")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Salon vocal ou texte")
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((o) => o.setName("template").setDescription("Ex: Membres: {count}")),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Statut AFK")
    .addSubcommand((s) =>
      s.setName("set").setDescription("Activer AFK").addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("clear").setDescription("Retirer AFK")),

  new SlashCommandBuilder()
    .setName("reminder")
    .setDescription("Rappel personnel")
    .addStringOption((o) => o.setName("message").setDescription("Message").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("minutes").setDescription("Dans combien de minutes").setRequired(true).setMinValue(1).setMaxValue(10080),
    ),

  new SlashCommandBuilder()
    .setName("autosetup")
    .setDescription("[Admin] Setup complet template + logs")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o
        .setName("template")
        .setDescription("Template")
        .addChoices(
          { name: "Gaming", value: "gaming" },
          { name: "Support", value: "support" },
          { name: "Communauté", value: "community" },
        ),
    ),

  new SlashCommandBuilder()
    .setName("seterrorlog")
    .setDescription("[Admin] Salon logs erreurs bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText).setRequired(true),
    ),

  new SlashCommandBuilder().setName("shadow").setDescription("Easter egg"),
];
