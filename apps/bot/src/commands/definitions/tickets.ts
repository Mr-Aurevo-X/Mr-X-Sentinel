import { SlashCommandBuilder, ChannelType } from "./shared.js";

export const ticketsCommands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Système de tickets")
    .addSubcommand((s) => s.setName("open").setDescription("Ouvrir un ticket"))
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription("[Admin] Configurer le panneau tickets")
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
    .addSubcommand((s) => s.setName("close").setDescription("[Staff] Fermer ce ticket"))
    .addSubcommand((s) => s.setName("claim").setDescription("[Staff] Prendre ce ticket"))
    .addSubcommand((s) =>
      s
        .setName("reopen")
        .setDescription("[Staff] Rouvrir un ticket pour un membre")
        .addUserOption((o) => o.setName("user").setDescription("Propriétaire").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("[Staff] Ajouter un membre au ticket")
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("[Staff] Retirer un membre du ticket")
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("rename")
        .setDescription("[Staff] Renommer ce ticket")
        .addStringOption((o) => o.setName("name").setDescription("Nouveau nom").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("config").setDescription("[Staff] Voir config tickets")),
];
