import { SlashCommandBuilder, tierDesc } from "./shared.js";

export const ownerCommands = [
  new SlashCommandBuilder()
    .setName("owner")
    .setDescription(tierDesc("bot_owner", "Modifier économie / XP"))
    .setDefaultMemberPermissions(0n)
    .addSubcommand((s) =>
      s
        .setName("balance")
        .setDescription(tierDesc("bot_owner", "Modifier le solde d'un membre"))
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
        .addIntegerOption((o) => o.setName("cash").setDescription("Cash").setRequired(true).setMinValue(0))
        .addIntegerOption((o) => o.setName("bank").setDescription("Banque").setMinValue(0)),
    )
    .addSubcommand((s) =>
      s
        .setName("xp")
        .setDescription(tierDesc("bot_owner", "Modifier XP / niveau"))
        .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
        .addIntegerOption((o) => o.setName("xp").setDescription("XP total").setRequired(true).setMinValue(0))
        .addIntegerOption((o) => o.setName("level").setDescription("Niveau").setRequired(true).setMinValue(0)),
    ),
];
