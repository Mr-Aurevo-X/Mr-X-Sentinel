import { SlashCommandBuilder, ChannelType, modPerms, tierDesc } from "./shared.js";

export const extendedCommands = [
  new SlashCommandBuilder()
    .setName("channel")
    .setDescription(tierDesc("mod", "Gestion salon"))
    .setDefaultMemberPermissions(modPerms)
    .addSubcommand((s) =>
      s
        .setName("slowmode")
        .setDescription(tierDesc("mod", "Slowmode"))
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
        .setDescription(tierDesc("mod", "Verrouiller un salon"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("unlock")
        .setDescription(tierDesc("mod", "Déverrouiller un salon"))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Salon").addChannelTypes(ChannelType.GuildText),
        ),
    ),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription(tierDesc("public", "Statut AFK"))
    .addSubcommand((s) =>
      s.setName("set").setDescription(tierDesc("public", "Activer AFK")).addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("clear").setDescription(tierDesc("public", "Retirer AFK"))),

  new SlashCommandBuilder()
    .setName("reminder")
    .setDescription(tierDesc("public", "Rappel personnel"))
    .addStringOption((o) => o.setName("message").setDescription("Message").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("minutes").setDescription("Dans combien de minutes").setRequired(true).setMinValue(1).setMaxValue(10080),
    ),

  new SlashCommandBuilder().setName("shadow").setDescription(tierDesc("public", "Easter egg")),
];
