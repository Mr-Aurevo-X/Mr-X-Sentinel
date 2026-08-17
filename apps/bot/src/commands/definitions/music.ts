import { SlashCommandBuilder } from "./shared.js";

export const musicCommands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Lire de la musique")
    .addStringOption((o) => o.setName("query").setDescription("URL ou recherche").setRequired(true)),

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
];
