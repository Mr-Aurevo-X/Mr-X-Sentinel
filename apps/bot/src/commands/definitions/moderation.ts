import { ChannelType, modCmd } from "./shared.js";

export const moderationCommands = [
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

  modCmd("clearwarn", "Effacer les warns d'un membre").addUserOption((o) =>
    o.setName("user").setDescription("Membre").setRequired(true),
  ),

  modCmd("nickname", "Changer le pseudo")
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
    .addStringOption((o) => o.setName("name").setDescription("Nouveau pseudo").setRequired(true)),

  modCmd("softban", "Ban puis unban (purge messages)")
    .addUserOption((o) => o.setName("user").setDescription("Membre").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(true)),
];
