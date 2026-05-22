import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";

const modPerms = PermissionFlagsBits.ModerateMembers | PermissionFlagsBits.BanMembers;

function modCmd(name: string, desc: string) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(desc)
    .setDefaultMemberPermissions(modPerms);
}

export const commands = [
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

  modCmd("ban", "Bannir un membre")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true))
    .addIntegerOption((o) => o.setName("delete_days").setMinValue(0).setMaxValue(7)),

  modCmd("unban", "Débannir").addStringOption((o) => o.setName("user_id").setRequired(true)),

  modCmd("kick", "Expulser un membre")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true)),

  modCmd("mute", "Mute (timeout)")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true))
    .addIntegerOption((o) => o.setName("minutes").setRequired(true).setMinValue(1).setMaxValue(40320)),

  modCmd("unmute", "Retirer le mute").addUserOption((o) => o.setName("user").setRequired(true)),

  modCmd("warn", "Avertir")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("reason").setRequired(true)),

  modCmd("warnings", "Voir les avertissements").addUserOption((o) => o.setName("user").setRequired(true)),

  modCmd("clear", "Supprimer des messages")
    .addIntegerOption((o) => o.setName("amount").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName("user").setRequired(false)),

  modCmd("nuke", "Supprimer tous les messages du salon")
    .addChannelOption((o) =>
      o.setName("channel").addChannelTypes(ChannelType.GuildText).setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("security")
    .setDescription("Gestion sécurité")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("status").setDescription("État"))
    .addSubcommand((s) => s.setName("lockdown").setDescription("Lockdown"))
    .addSubcommand((s) => s.setName("unlock").setDescription("Unlock")),

  new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Snapshots")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("create").setDescription("Créer"))
    .addSubcommand((s) => s.setName("list").setDescription("Lister"))
    .addSubcommand((s) =>
      s.setName("restore").addStringOption((o) => o.setName("id").setRequired(true)),
    ),

  new SlashCommandBuilder()
    .setName("rank").setDescription("Voir ton niveau XP"),

  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Discuter avec l'IA")
    .addSubcommand((s) =>
      s.setName("message").addStringOption((o) => o.setName("prompt").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("reset").setDescription("Réinitialiser la conversation")),

  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Lire de la musique")
    .addStringOption((o) => o.setName("query").setDescription("URL ou recherche").setRequired(true)),

  new SlashCommandBuilder().setName("help").setDescription("Aide Mr-X Sentinel"),

  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configuration du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("view").setDescription("Voir la config"))
    .addSubcommand((s) =>
      s
        .setName("feature")
        .setDescription("Activer/désactiver un module")
        .addStringOption((o) =>
          o
            .setName("module")
            .setRequired(true)
            .addChoices(
              { name: "Community", value: "community" },
              { name: "Economy", value: "economy" },
              { name: "Levels", value: "levels" },
              { name: "Tickets", value: "tickets" },
              { name: "Music", value: "music" },
              { name: "AI", value: "ai" },
            ),
        )
        .addBooleanOption((o) => o.setName("enabled").setRequired(true)),
    ),

  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Outils administrateur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("announce")
        .setDescription("Annonce embed")
        .addChannelOption((o) =>
          o.setName("channel").addChannelTypes(ChannelType.GuildText).setRequired(true),
        )
        .addStringOption((o) => o.setName("title").setRequired(true))
        .addStringOption((o) => o.setName("message").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("shop_add")
        .setDescription("Ajouter un article boutique")
        .addStringOption((o) => o.setName("name").setRequired(true))
        .addIntegerOption((o) => o.setName("price").setRequired(true).setMinValue(1))
        .addRoleOption((o) => o.setName("role").setRequired(false)),
    ),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Système de tickets")
    .addSubcommand((s) => s.setName("open").setDescription("Ouvrir un ticket"))
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription("[Admin] Configurer le panneau tickets")
        .addChannelOption((o) =>
          o.setName("panel").addChannelTypes(ChannelType.GuildText).setRequired(true),
        )
        .addRoleOption((o) => o.setName("support_role").setRequired(false)),
    )
    .addSubcommand((s) => s.setName("close").setDescription("[Staff] Fermer ce ticket"))
    .addSubcommand((s) => s.setName("claim").setDescription("[Staff] Prendre ce ticket")),

  new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Casino & mini-jeux")
    .addSubcommand((s) =>
      s
        .setName("coinflip")
        .addIntegerOption((o) => o.setName("bet").setRequired(true).setMinValue(10).setMaxValue(50_000)),
    )
    .addSubcommand((s) =>
      s
        .setName("slots")
        .addIntegerOption((o) => o.setName("bet").setRequired(true).setMinValue(10).setMaxValue(50_000)),
    )
    .addSubcommand((s) =>
      s
        .setName("roulette")
        .addIntegerOption((o) => o.setName("bet").setRequired(true).setMinValue(10).setMaxValue(50_000))
        .addStringOption((o) =>
          o
            .setName("color")
            .setRequired(true)
            .addChoices(
              { name: "Rouge", value: "red" },
              { name: "Noir", value: "black" },
              { name: "Vert (0)", value: "green" },
            ),
        ),
    ),

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Voir ton portefeuille")
    .addUserOption((o) => o.setName("user").setRequired(false)),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Payer un membre")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addIntegerOption((o) => o.setName("amount").setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Tenter de braquer un membre")
    .addUserOption((o) => o.setName("user").setRequired(true)),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription("Crime aléatoire (cooldown 2h)"),

  new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Déposer en banque")
    .addIntegerOption((o) => o.setName("amount").setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Retirer de la banque")
    .addIntegerOption((o) => o.setName("amount").setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Classement économie du serveur"),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Boutique du serveur")
    .addSubcommand((s) => s.setName("list").setDescription("Lister les articles"))
    .addSubcommand((s) =>
      s
        .setName("buy")
        .setDescription("Acheter")
        .addStringOption((o) => o.setName("item_id").setRequired(true)),
    ),

  new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Envoyer une suggestion")
    .addStringOption((o) => o.setName("idea").setRequired(true)),

  new SlashCommandBuilder()
    .setName("brain")
    .setDescription("Mr-X Brain (anti-scam)")
    .addSubcommand((s) => s.setName("status").setDescription("État du service Brain")),

  modCmd("clearwarn", "Effacer les warns d'un membre").addUserOption((o) =>
    o.setName("user").setRequired(true),
  ),

  modCmd("nickname", "Changer le pseudo")
    .addUserOption((o) => o.setName("user").setRequired(true))
    .addStringOption((o) => o.setName("name").setRequired(true)),
];
