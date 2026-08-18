import { SlashCommandBuilder, ChannelType, tierDesc } from "./shared.js";

export const ticketsCommands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Système de tickets")
    .addSubcommand((s) => s.setName("open").setDescription(tierDesc("public", "Ouvrir un ticket")))
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription(tierDesc("guild_owner", "Configurer le panneau tickets"))
        .addChannelOption((o) =>
          o
            .setName("panel")
            .setDescription("Salon du panneau tickets")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addRoleOption((o) =>
          o.setName("support_role").setDescription("Rôle support").setRequired(false),
        ),
    )
    .addSubcommand((s) => s.setName("close").setDescription(tierDesc("mod", "Fermer ce ticket")))
    .addSubcommand((s) => s.setName("claim").setDescription(tierDesc("mod", "Prendre ce ticket")))
    .addSubcommand((s) =>
      s
        .setName("reopen")
        .setDescription(tierDesc("mod", "Rouvrir un ticket pour un membre"))
        .addUserOption((o) => o.setName("user").setDescription("Propriétaire").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription(tierDesc("mod", "Ajouter un membre au ticket"))
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription(tierDesc("mod", "Retirer un membre du ticket"))
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("rename")
        .setDescription(tierDesc("mod", "Renommer ce ticket"))
        .addStringOption((o) => o.setName("name").setDescription("Nouveau nom").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("config").setDescription(tierDesc("mod", "Voir config tickets"))),
];
