import { SlashCommandBuilder } from "./shared.js";

export const funCommands = [
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

  new SlashCommandBuilder().setName("gamble").setDescription("Hub casino"),

  new SlashCommandBuilder().setName("minijeux").setDescription("Hub mini-jeux"),
];
