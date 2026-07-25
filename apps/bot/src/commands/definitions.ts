import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { SHOP_CATALOG } from "@sentinel/shared";

const buyChoices = Object.entries(SHOP_CATALOG)
  .slice(0, 25)
  .map(([key, e]) => ({ name: `${e.emoji} ${e.label}`.slice(0, 100), value: key }));

const modPerms =
  PermissionFlagsBits.ModerateMembers |
  PermissionFlagsBits.BanMembers |
  PermissionFlagsBits.KickMembers |
  PermissionFlagsBits.ManageMessages;

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
    .addUserOption((o) => o.setName("user").setDescription("Membre à bannir").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Raison du ban").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("delete_days").setDescription("Jours de messages à supprimer").setMinValue(0).setMaxValue(7),
    ),

  modCmd("unban", "Débannir").addStringOption((o) =>
    o.setName("user_id").setDescription("ID Discord du membre").setRequired(true),
  ),

  modCmd("kick", "Expulser un membre")
    .addUserOption((o) => o.setName("user").setDescription("Membre à expulser").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(true)),

  modCmd("mute", "Mute (timeout)")
    .addUserOption((o) => o.setName("user").setDescription("Membre à mute").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("minutes").setDescription("Durée en minutes").setRequired(true).setMinValue(1).setMaxValue(40320),
    ),

  modCmd("unmute", "Retirer le mute").addUserOption((o) =>
    o.setName("user").setDescription("Membre").setRequired(true),
  ),

  modCmd("warn", "Avertir")
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(true)),

  modCmd("warnings", "Voir les avertissements").addUserOption((o) =>
    o.setName("user").setDescription("Membre").setRequired(true),
  ),

  modCmd("clear", "Supprimer des messages")
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Nombre de messages").setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .addUserOption((o) => o.setName("user").setDescription("Filtrer par membre").setRequired(false)),

  modCmd("nuke", "Supprimer tous les messages du salon")
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Salon à vider")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    ),

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

  new SlashCommandBuilder()
    .setName("rank").setDescription("Voir ton niveau XP"),

  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Discuter avec l'IA")
    .addSubcommand((s) =>
      s
        .setName("message")
        .setDescription("Envoyer un message à l'IA")
        .addStringOption((o) => o.setName("prompt").setDescription("Votre question").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("reset").setDescription("Réinitialiser la conversation"))
    .addSubcommand((s) =>
      s
        .setName("mode")
        .setDescription("Mode de contexte IA")
        .addStringOption((o) =>
          o
            .setName("context")
            .setDescription("user | channel | thread")
            .setRequired(true)
            .addChoices(
              { name: "Par utilisateur", value: "user" },
              { name: "Par salon", value: "channel" },
              { name: "Par fil", value: "thread" },
            ),
        ),
    ),

  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Lire de la musique")
    .addStringOption((o) => o.setName("query").setDescription("URL ou recherche").setRequired(true)),

  new SlashCommandBuilder().setName("help").setDescription("Aide Mr-X Sentinel"),

  new SlashCommandBuilder().setName("ping").setDescription("Latence du bot"),

  new SlashCommandBuilder().setName("botinfo").setDescription("Informations sur Mr-X Sentinel"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Informations sur un membre")
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(false)),

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
            .setDescription("Module à modifier")
            .setRequired(true)
            .addChoices(
              { name: "Security", value: "security" },
              { name: "Snapshots", value: "snapshots" },
              { name: "Automod", value: "automod" },
              { name: "Moderation", value: "moderation" },
              { name: "Community", value: "community" },
              { name: "Economy", value: "economy" },
              { name: "Levels", value: "levels" },
              { name: "Tickets", value: "tickets" },
              { name: "Templates", value: "templates" },
              { name: "Music", value: "music" },
              { name: "AI", value: "ai" },
              { name: "Brain", value: "brain" },
              { name: "Fun", value: "fun" },
            ),
        )
        .addBooleanOption((o) =>
          o.setName("enabled").setDescription("Activer ou désactiver").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("welcome")
        .setDescription("Salons bienvenue / départ / rôle auto")
        .addChannelOption((o) =>
          o.setName("welcome_channel").setDescription("Salon de bienvenue").addChannelTypes(ChannelType.GuildText),
        )
        .addChannelOption((o) =>
          o.setName("goodbye_channel").setDescription("Salon de départ").addChannelTypes(ChannelType.GuildText),
        )
        .addRoleOption((o) => o.setName("auto_role").setDescription("Rôle auto à l'arrivée")),
    )
    .addSubcommand((s) => s.setName("welcome_panel").setDescription("Panneau setup welcome (créer salons)"))
    .addSubcommand((s) =>
      s
        .setName("economy")
        .setDescription("Réglages économie")
        .addIntegerOption((o) => o.setName("daily_min").setDescription("Daily min").setMinValue(0))
        .addIntegerOption((o) => o.setName("daily_max").setDescription("Daily max").setMinValue(0))
        .addIntegerOption((o) => o.setName("work_min").setDescription("Work min").setMinValue(0))
        .addIntegerOption((o) => o.setName("work_max").setDescription("Work max").setMinValue(0)),
    ),

  new SlashCommandBuilder()
    .setName("template")
    .setDescription("[Owner] Panneau templates serveur (appliquer / reset)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("panel").setDescription("Ouvrir le panneau templates")),

  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Outils administrateur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("announce")
        .setDescription("Annonce embed")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Salon de publication")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((o) => o.setName("title").setDescription("Titre").setRequired(true))
        .addStringOption((o) => o.setName("message").setDescription("Contenu").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("shop_add")
        .setDescription("Ajouter un article boutique")
        .addStringOption((o) => o.setName("name").setDescription("Nom de l'article").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("price").setDescription("Prix en $").setRequired(true).setMinValue(1),
        )
        .addRoleOption((o) => o.setName("role").setDescription("Rôle attribué").setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName("shop_remove")
        .setDescription("Retirer un article boutique")
        .addStringOption((o) => o.setName("item_id").setDescription("ID article").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("panel").setDescription("Panneau admin + mod"))
    .addSubcommand((s) =>
      s
        .setName("roles")
        .setDescription("Rôles mod / ticket")
        .addRoleOption((o) => o.setName("mod_role").setDescription("Rôle modération"))
        .addRoleOption((o) => o.setName("ticket_role").setDescription("Rôle support tickets")),
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

  new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Casino & mini-jeux")
    .addSubcommand((s) =>
      s
        .setName("coinflip")
        .setDescription("Pile ou face")
        .addIntegerOption((o) =>
          o.setName("bet").setDescription("Mise en $").setRequired(true).setMinValue(10).setMaxValue(50_000),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("slots")
        .setDescription("Machine à sous")
        .addIntegerOption((o) =>
          o.setName("bet").setDescription("Mise en $").setRequired(true).setMinValue(10).setMaxValue(50_000),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("blackjack")
        .setDescription("Blackjack (tirage instantané)")
        .addIntegerOption((o) =>
          o.setName("bet").setDescription("Mise en $").setRequired(true).setMinValue(10).setMaxValue(50_000),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("roulette")
        .setDescription("Roulette")
        .addIntegerOption((o) =>
          o.setName("bet").setDescription("Mise en $").setRequired(true).setMinValue(10).setMaxValue(50_000),
        )
        .addStringOption((o) =>
          o
            .setName("color")
            .setDescription("Couleur")
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
    .addUserOption((o) => o.setName("user").setDescription("Membre (optionnel)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Payer un membre")
    .addUserOption((o) => o.setName("user").setDescription("Destinataire").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Montant").setRequired(true).setMinValue(1),
    ),

  new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Tenter de braquer un membre")
    .addUserOption((o) => o.setName("user").setDescription("Victime").setRequired(true)),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription("Crime aléatoire (cooldown 2h)"),

  new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Déposer en banque")
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Montant").setRequired(true).setMinValue(1),
    ),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Retirer de la banque")
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Montant").setRequired(true).setMinValue(1),
    ),

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
        .addStringOption((o) =>
          o.setName("item_id").setDescription("ID de l'article").setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Envoyer une suggestion")
    .addStringOption((o) => o.setName("idea").setDescription("Votre idée").setRequired(true)),

  new SlashCommandBuilder()
    .setName("brain")
    .setDescription("Mr-X Brain (anti-scam)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName("status").setDescription("État du service Brain"))
    .addSubcommand((s) =>
      s
        .setName("analyse")
        .setDescription("Analyser un texte")
        .addStringOption((o) => o.setName("text").setDescription("Texte").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("toggle")
        .setDescription("Activer/désactiver Brain")
        .addBooleanOption((o) => o.setName("enabled").setDescription("État").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("seuil")
        .setDescription("Seuils spam/toxicité (info env)")
        .addNumberOption((o) => o.setName("spam").setDescription("0-1").setMinValue(0).setMaxValue(1))
        .addNumberOption((o) => o.setName("toxicity").setDescription("0-1").setMinValue(0).setMaxValue(1)),
    ),

  modCmd("clearwarn", "Effacer les warns d'un membre").addUserOption((o) =>
    o.setName("user").setDescription("Membre").setRequired(true),
  ),

  modCmd("nickname", "Changer le pseudo")
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
    .addStringOption((o) => o.setName("name").setDescription("Nouveau pseudo").setRequired(true)),

  new SlashCommandBuilder().setName("lvl_info").setDescription("Fonctionnement du système de niveaux"),

  new SlashCommandBuilder().setName("daily").setDescription("Récompense quotidienne"),
  new SlashCommandBuilder().setName("weekly").setDescription("Récompense hebdomadaire"),
  new SlashCommandBuilder().setName("monthly").setDescription("Récompense mensuelle"),
  new SlashCommandBuilder().setName("work").setDescription("Travailler pour gagner de l'argent"),

  new SlashCommandBuilder().setName("eco").setDescription("Hub économie interactif"),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Acheter un objet du catalogue")
    .addStringOption((o) =>
      o
        .setName("item")
        .setDescription("Objet à acheter")
        .setRequired(true)
        .addChoices(...buyChoices),
    ),

  new SlashCommandBuilder()
    .setName("use")
    .setDescription("Utiliser un objet de l'inventaire")
    .addStringOption((o) =>
      o.setName("item").setDescription("Clé de l'objet").setRequired(true),
    ),

  new SlashCommandBuilder().setName("gamble").setDescription("Hub casino"),
  new SlashCommandBuilder().setName("minijeux").setDescription("Hub mini-jeux"),

  new SlashCommandBuilder()
    .setName("setlevelchannel")
    .setDescription("[Owner] Salon des annonces level-up")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Salon texte").addChannelTypes(ChannelType.GuildText).setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("removelevelchannel")
    .setDescription("[Owner] Retirer le salon level-up")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("levelsinfo")
    .setDescription("[Owner] Configuration des niveaux")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  modCmd("softban", "Ban puis unban (purge messages)")
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(true)),

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
    .setName("owner")
    .setDescription("[Bot owner] Modifier économie / XP")
    .setDefaultMemberPermissions(0n)
    .addSubcommand((s) =>
      s
        .setName("balance")
        .setDescription("Modifier le solde d'un membre")
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
        .addIntegerOption((o) => o.setName("cash").setDescription("Cash").setRequired(true).setMinValue(0))
        .addIntegerOption((o) => o.setName("bank").setDescription("Banque").setMinValue(0)),
    )
    .addSubcommand((s) =>
      s
        .setName("xp")
        .setDescription("Modifier XP / niveau")
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
        .addIntegerOption((o) => o.setName("xp").setDescription("XP total").setRequired(true).setMinValue(0))
        .addIntegerOption((o) => o.setName("level").setDescription("Niveau").setRequired(true).setMinValue(0)),
    ),

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
    .setName("levels")
    .setDescription("[Owner] Réglages niveaux")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("roles")
        .setDescription("Rôles référence pour récompenses level")
        .addRoleOption((o) => o.setName("reference_role").setDescription("Rôle référence"))
        .addRoleOption((o) => o.setName("bot_role").setDescription("Rôle du bot")),
    ),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Statistiques serveur et bot"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Infos du serveur"),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Avatar d'un membre")
    .addUserOption((o) => o.setName("user").setDescription("Membre")),

  new SlashCommandBuilder()
    .setName("music")
    .setDescription("Contrôles musique")
    .addSubcommand((s) => s.setName("pause").setDescription("Pause / reprise"))
    .addSubcommand((s) => s.setName("resume").setDescription("Reprendre"))
    .addSubcommand((s) => s.setName("skip").setDescription("Piste suivante"))
    .addSubcommand((s) => s.setName("stop").setDescription("Arrêter"))
    .addSubcommand((s) => s.setName("queue").setDescription("File d'attente"))
    .addSubcommand((s) => s.setName("nowplaying").setDescription("Piste en cours"))
    .addSubcommand((s) =>
      s
        .setName("volume")
        .setDescription("Volume")
        .addIntegerOption((o) =>
          o.setName("level").setDescription("0-200").setRequired(true).setMinValue(0).setMaxValue(200),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("loop")
        .setDescription("Boucle")
        .addStringOption((o) =>
          o
            .setName("mode")
            .setDescription("off | track | queue")
            .setRequired(true)
            .addChoices(
              { name: "Off", value: "off" },
              { name: "Piste", value: "track" },
              { name: "File", value: "queue" },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("seek")
        .setDescription("Aller à une position")
        .addIntegerOption((o) =>
          o.setName("seconds").setDescription("Secondes").setRequired(true).setMinValue(0),
        ),
    )
    .addSubcommand((s) => s.setName("shuffle").setDescription("Mélanger la file"))
    .addSubcommand((s) =>
      s
        .setName("247")
        .setDescription("Rester en vocal 24/7")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Activer").setRequired(true)),
    ),

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
