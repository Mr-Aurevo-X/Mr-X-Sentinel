import { SlashCommandBuilder, PermissionFlagsBits } from "./shared.js";

export const securityCommands = [
  new SlashCommandBuilder()
    .setName("security")
    .setDescription("Gestion sécurité")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("status").setDescription("État"))
    .addSubcommand((s) => s.setName("lockdown").setDescription("Lockdown"))
    .addSubcommand((s) => s.setName("unlock").setDescription("Unlock"))
    .addSubcommand((s) =>
      s
        .setName("whitelist_add")
        .setDescription("Ajouter un membre à la whitelist anti-nuke")
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
        .addStringOption((o) =>
          o
            .setName("level")
            .setDescription("Niveau")
            .setRequired(true)
            .addChoices(
              { name: "Extra owner", value: "EXTRA_OWNER" },
              { name: "Trusted", value: "TRUSTED" },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("whitelist_remove")
        .setDescription("Retirer un membre de la whitelist")
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("whitelist_list").setDescription("Lister la whitelist")),

  new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Panneau automodération")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName("panel").setDescription("Ouvrir le panneau"))
    .addSubcommand((s) =>
      s
        .setName("toggle")
        .setDescription("Activer / désactiver l'automod")
        .addBooleanOption((o) => o.setName("enabled").setDescription("État").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("words_add")
        .setDescription("Ajouter un mot interdit")
        .addStringOption((o) => o.setName("word").setDescription("Mot").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("words_remove")
        .setDescription("Retirer un mot interdit")
        .addStringOption((o) => o.setName("word").setDescription("Mot").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("status").setDescription("Résumé de la config")),

  new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Snapshots")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("create").setDescription("Créer"))
    .addSubcommand((s) => s.setName("list").setDescription("Lister"))
    .addSubcommand((s) =>
      s
        .setName("restore")
        .setDescription("Restaurer un snapshot")
        .addStringOption((o) => o.setName("id").setDescription("ID du snapshot").setRequired(true)),
    ),
];
