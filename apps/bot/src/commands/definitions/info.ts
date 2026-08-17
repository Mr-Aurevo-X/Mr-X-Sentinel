import { SlashCommandBuilder } from "./shared.js";

export const infoCommands = [
  new SlashCommandBuilder().setName("help").setDescription("Aide Mr-X Sentinel"),

  new SlashCommandBuilder().setName("ping").setDescription("Latence du bot"),

  new SlashCommandBuilder().setName("botinfo").setDescription("Informations sur Mr-X Sentinel"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Informations sur un membre")
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(false)),

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
];
