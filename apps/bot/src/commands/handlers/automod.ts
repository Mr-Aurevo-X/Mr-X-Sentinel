import type { ChatInputCommandInteraction } from "discord.js";
import { getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import { buildAutomodPanelRows } from "../../views/AutomodPanelView.js";
import type { CommandReply } from "../middleware.js";

export async function handleAutomod(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const cfg = await getGuildConfig(guildId);

  if (sub === "panel") {
    const am = cfg.automod;
    return {
      embeds: [
        buildSimpleEmbed(
          "Automod",
          [
            `État : **${am.enabled ? "ON" : "OFF"}**`,
            `Mentions max : **${am.maxMentions}** · Flood : **${am.maxMessagesPerSec}/s**`,
            `Invites : **${am.blockInvites ? "bloquées" : "autorisées"}**`,
            `Caps : **${am.blockCaps ? "ON" : "OFF"}** (${Math.round((am.capsRatioLimit ?? 0.7) * 100)}%)`,
            `Zalgo : **${am.blockZalgo ? "ON" : "OFF"}**`,
            `URLs externes : **${am.blockExternalUrls ? "bloquées" : "autorisées"}**`,
            `Mots : **${am.wordBlacklist.length}** · URLs : **${am.blockedUrls.length}**`,
          ].join("\n"),
          0x5865f2,
        ),
      ],
      components: buildAutomodPanelRows(am.enabled),
    };
  }

  if (sub === "toggle") {
    const enabled = interaction.options.getBoolean("enabled", true);
    await updateGuildConfig(guildId, { automod: { ...cfg.automod, enabled } });
    return { embeds: [successEmbed("Automod", `Module **${enabled ? "activé" : "désactivé"}**.`)] };
  }

  if (sub === "words_add") {
    const word = interaction.options.getString("word", true).toLowerCase().trim();
    if (cfg.automod.wordBlacklist.includes(word)) {
      throw new Error("Mot déjà dans la liste.");
    }
    const wordBlacklist = [...cfg.automod.wordBlacklist, word].slice(0, 100);
    await updateGuildConfig(guildId, { automod: { ...cfg.automod, wordBlacklist } });
    return { embeds: [successEmbed("Mot ajouté", `\`${word}\``)] };
  }

  if (sub === "words_remove") {
    const word = interaction.options.getString("word", true).toLowerCase().trim();
    const wordBlacklist = cfg.automod.wordBlacklist.filter((w) => w !== word);
    await updateGuildConfig(guildId, { automod: { ...cfg.automod, wordBlacklist } });
    return { embeds: [successEmbed("Mot retiré", `\`${word}\``)] };
  }

  const am = cfg.automod;
  return {
    embeds: [
      buildSimpleEmbed(
        "Statut automod",
        `ON: ${am.enabled} · Caps: ${am.blockCaps} · Zalgo: ${am.blockZalgo} · Mots: ${am.wordBlacklist.length}`,
      ),
    ],
  };
}
