import { SlashCommandBuilder, PermissionFlagsBits, tierDesc } from "./shared.js";

export const securityCommands = [
  new SlashCommandBuilder()
    .setName("security")
    .setDescription(tierDesc("admin", "Gestion sécurité"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("status").setDescription(tierDesc("admin", "État")))
    .addSubcommand((s) => s.setName("lockdown").setDescription(tierDesc("admin", "Lockdown")))
    .addSubcommand((s) => s.setName("unlock").setDescription(tierDesc("admin", "Unlock")))
    .addSubcommand((s) =>
      s
        .setName("whitelist_add")
        .setDescription(tierDesc("guild_owner", "Ajouter un membre à la whitelist anti-nuke"))
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
        .setDescription(tierDesc("guild_owner", "Retirer un membre de la whitelist"))
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("whitelist_list").setDescription(tierDesc("guild_owner", "Lister la whitelist"))),

  new SlashCommandBuilder()
    .setName("automod")
    .setDescription(tierDesc("admin", "Panneau automodération"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName("panel").setDescription(tierDesc("admin", "Ouvrir le panneau")))
    .addSubcommand((s) =>
      s
        .setName("toggle")
        .setDescription(tierDesc("admin", "Activer / désactiver l'automod"))
        .addBooleanOption((o) => o.setName("enabled").setDescription("État").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("words_add")
        .setDescription(tierDesc("admin", "Ajouter un mot interdit"))
        .addStringOption((o) => o.setName("word").setDescription("Mot").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("words_remove")
        .setDescription(tierDesc("admin", "Retirer un mot interdit"))
        .addStringOption((o) => o.setName("word").setDescription("Mot").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("status").setDescription(tierDesc("admin", "Résumé de la config"))),

  new SlashCommandBuilder()
    .setName("backup")
    .setDescription(tierDesc("admin", "Snapshots"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("create").setDescription(tierDesc("admin", "Créer")))
    .addSubcommand((s) => s.setName("list").setDescription(tierDesc("admin", "Lister")))
    .addSubcommand((s) =>
      s
        .setName("restore")
        .setDescription(tierDesc("guild_owner", "Restaurer un snapshot"))
        .addStringOption((o) => o.setName("id").setDescription("ID du snapshot").setRequired(true)),
    ),
];
