import { SlashCommandBuilder, tierDesc } from "./shared.js";

export const infoCommands = [
  new SlashCommandBuilder().setName("help").setDescription(tierDesc("public", "Aide Mr-X Sentinel")),

  new SlashCommandBuilder().setName("ping").setDescription(tierDesc("public", "Latence du bot")),

  new SlashCommandBuilder().setName("botinfo").setDescription(tierDesc("public", "Informations sur Mr-X Sentinel")),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription(tierDesc("public", "Informations sur un membre"))
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(false)),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription(tierDesc("public", "Infos du serveur")),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription(tierDesc("public", "Avatar d'un membre"))
    .addUserOption((o) => o.setName("user").setDescription("Membre")),
];
