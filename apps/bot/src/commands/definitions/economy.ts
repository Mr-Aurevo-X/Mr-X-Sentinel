import { SlashCommandBuilder, buyChoices, tierDesc } from "./shared.js";

export const economyCommands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription(tierDesc("public", "Voir ton portefeuille"))
    .addUserOption((o) => o.setName("user").setDescription("Membre (optionnel)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription(tierDesc("public", "Payer un membre"))
    .addUserOption((o) => o.setName("user").setDescription("Destinataire").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Montant").setRequired(true).setMinValue(1),
    ),

  new SlashCommandBuilder()
    .setName("rob")
    .setDescription(tierDesc("public", "Tenter de braquer un membre"))
    .addUserOption((o) => o.setName("user").setDescription("Victime").setRequired(true)),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription(tierDesc("public", "Crime aléatoire (cooldown 2h)")),

  new SlashCommandBuilder()
    .setName("deposit")
    .setDescription(tierDesc("public", "Déposer en banque"))
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Montant").setRequired(true).setMinValue(1),
    ),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription(tierDesc("public", "Retirer de la banque"))
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Montant").setRequired(true).setMinValue(1),
    ),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription(tierDesc("public", "Classement économie du serveur")),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription(tierDesc("public", "Boutique du serveur"))
    .addSubcommand((s) => s.setName("list").setDescription(tierDesc("public", "Lister les articles")))
    .addSubcommand((s) =>
      s
        .setName("buy")
        .setDescription(tierDesc("public", "Acheter"))
        .addStringOption((o) =>
          o.setName("item_id").setDescription("ID de l'article").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("catalog")
        .setDescription(tierDesc("public", "Acheter un objet du catalogue"))
        .addStringOption((o) =>
          o
            .setName("item")
            .setDescription("Objet à acheter")
            .setRequired(true)
            .addChoices(...buyChoices),
        ),
    ),

  new SlashCommandBuilder().setName("daily").setDescription(tierDesc("public", "Récompense quotidienne")),

  new SlashCommandBuilder().setName("weekly").setDescription(tierDesc("public", "Récompense hebdomadaire")),

  new SlashCommandBuilder().setName("monthly").setDescription(tierDesc("public", "Récompense mensuelle")),

  new SlashCommandBuilder().setName("work").setDescription(tierDesc("public", "Travailler pour gagner de l'argent")),

  new SlashCommandBuilder()
    .setName("use")
    .setDescription(tierDesc("public", "Utiliser un objet de l'inventaire"))
    .addStringOption((o) =>
      o.setName("item").setDescription("Clé de l'objet").setRequired(true),
    ),
];
