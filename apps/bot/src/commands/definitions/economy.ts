import { SlashCommandBuilder, buyChoices } from "./shared.js";

export const economyCommands = [
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
];
