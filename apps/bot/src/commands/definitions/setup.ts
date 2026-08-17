import { SlashCommandBuilder, PermissionFlagsBits } from "./shared.js";

export const setupCommands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configurer Mr-X Sentinel sur ce serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o.setName("create_logs").setDescription("Créer les salons de logs automatiquement").setRequired(false),
    )
    .addStringOption((o) =>
      o
        .setName("template")
        .setDescription("Appliquer un template serveur (gaming, support, …)")
        .setRequired(false)
        .addChoices(
          { name: "Community", value: "community" },
          { name: "Gaming", value: "gaming" },
          { name: "Support", value: "support" },
          { name: "Creator", value: "creator" },
          { name: "Business", value: "business" },
          { name: "School", value: "school" },
          { name: "Esport", value: "esport" },
          { name: "Development", value: "development" },
          { name: "FiveM", value: "fivem" },
          { name: "Music", value: "music" },
          { name: "Anime", value: "anime" },
          { name: "Roleplay", value: "roleplay" },
          { name: "Minimal", value: "minimal" },
          { name: "Staff heavy", value: "staff-heavy" },
        ),
    ),

  new SlashCommandBuilder()
    .setName("fonctionnement")
    .setDescription("[Owner] Guide complet du bot sur ce serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o.setName("public").setDescription("Publier dans le salon (owner uniquement)").setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Panneau des salons de logs")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("panel").setDescription("Ouvrir le panneau"))
    .addSubcommand((s) => s.setName("create").setDescription("Créer tous les salons de logs")),

  new SlashCommandBuilder()
    .setName("sentinel")
    .setDescription("Menu principal — économie, fun, tickets")
    .addSubcommand((s) => s.setName("menu").setDescription("Ouvrir le hub")),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("[Staff] Panneau modération et outils")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
];
