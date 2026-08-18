import { SlashCommandBuilder, tierDesc } from "./shared.js";

export const musicCommands = [
  new SlashCommandBuilder()
    .setName("music")
    .setDescription(tierDesc("public", "Contrôles musique"))
    .addSubcommand((s) =>
      s
        .setName("play")
        .setDescription(tierDesc("public", "Lire de la musique"))
        .addStringOption((o) => o.setName("query").setDescription("URL ou recherche").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("pause").setDescription(tierDesc("public", "Pause / reprise")))
    .addSubcommand((s) => s.setName("resume").setDescription(tierDesc("public", "Reprendre")))
    .addSubcommand((s) => s.setName("skip").setDescription(tierDesc("public", "Piste suivante")))
    .addSubcommand((s) => s.setName("stop").setDescription(tierDesc("public", "Arrêter")))
    .addSubcommand((s) => s.setName("queue").setDescription(tierDesc("public", "File d'attente")))
    .addSubcommand((s) => s.setName("nowplaying").setDescription(tierDesc("public", "Piste en cours")))
    .addSubcommand((s) =>
      s
        .setName("volume")
        .setDescription(tierDesc("public", "Volume"))
        .addIntegerOption((o) =>
          o.setName("level").setDescription("0-200").setRequired(true).setMinValue(0).setMaxValue(200),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("loop")
        .setDescription(tierDesc("public", "Boucle"))
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
        .setDescription(tierDesc("public", "Aller à une position"))
        .addIntegerOption((o) =>
          o.setName("seconds").setDescription("Secondes").setRequired(true).setMinValue(0),
        ),
    )
    .addSubcommand((s) => s.setName("shuffle").setDescription(tierDesc("public", "Mélanger la file")))
    .addSubcommand((s) =>
      s
        .setName("247")
        .setDescription(tierDesc("public", "Rester en vocal 24/7"))
        .addBooleanOption((o) => o.setName("enabled").setDescription("Activer").setRequired(true)),
    ),
];
