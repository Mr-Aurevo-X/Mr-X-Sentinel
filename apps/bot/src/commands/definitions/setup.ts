import { SlashCommandBuilder, PermissionFlagsBits, tierDesc } from "./shared.js";
import { templateSlashChoices } from "./template-choices.js";

export const setupCommands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription(tierDesc("guild_owner", "Configurer Mr-X Sentinel sur ce serveur"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o.setName("create_logs").setDescription("Créer les salons de logs automatiquement").setRequired(false),
    )
    .addStringOption((o) => {
      const opt = o
        .setName("template")
        .setDescription("Appliquer un template serveur (gaming, support, …)")
        .setRequired(false);
      const choices = templateSlashChoices();
      if (choices.length > 0) opt.addChoices(...choices);
      return opt;
    })
    .addRoleOption((o) => o.setName("mod_role").setDescription("Rôle modération").setRequired(false))
    .addRoleOption((o) => o.setName("ticket_role").setDescription("Rôle support tickets").setRequired(false)),

  new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription(tierDesc("guild_owner", "Lien du dashboard web de ce serveur"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("fonctionnement")
    .setDescription(tierDesc("guild_owner", "Guide complet du bot sur ce serveur"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o.setName("public").setDescription("Publier dans le salon (owner uniquement)").setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("logs")
    .setDescription(tierDesc("admin", "Panneau des salons de logs"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("panel").setDescription(tierDesc("admin", "Ouvrir le panneau")))
    .addSubcommand((s) => s.setName("create").setDescription(tierDesc("guild_owner", "Créer tous les salons de logs"))),

  new SlashCommandBuilder()
    .setName("sentinel")
    .setDescription(tierDesc("public", "Menu principal — économie, fun, tickets"))
    .addSubcommand((s) => s.setName("menu").setDescription(tierDesc("public", "Ouvrir le hub")))
    .addSubcommand((s) => s.setName("about").setDescription(tierDesc("public", "À propos de Mr-X Sentinel"))),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription(tierDesc("mod", "Panneau modération et outils"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
];
