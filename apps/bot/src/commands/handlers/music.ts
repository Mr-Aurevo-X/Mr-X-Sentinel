import type { ChatInputCommandInteraction } from "discord.js";
import { musicManager, type LoopMode } from "../../music/MusicManager.js";
import { buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleMusic(
  interaction: ChatInputCommandInteraction,
  _client: import("discord.js").Client,
): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const player = musicManager.getPlayer(guildId);

  if (sub === "pause") {
    if (!player) throw new Error("Aucune lecture.");
    player.pause(!player.paused);
    return { embeds: [successEmbed("Musique", player.paused ? "Pause." : "Reprise.")] };
  }
  if (sub === "resume") {
    if (!player) throw new Error("Aucune lecture.");
    player.pause(false);
    return { embeds: [successEmbed("Musique", "Reprise.")] };
  }
  if (sub === "skip") {
    if (!player) throw new Error("Aucune lecture.");
    await player.skip();
    return { embeds: [successEmbed("Musique", "Piste suivante.")] };
  }
  if (sub === "stop") {
    musicManager.set247(guildId, false);
    player?.destroy();
    return { embeds: [successEmbed("Musique", "Arrêté.")] };
  }
  if (sub === "queue") {
    if (!player) throw new Error("Aucune lecture.");
    const q = player.queue.map((t) => t.title).slice(0, 15).join("\n") || "(vide)";
    return { embeds: [buildSimpleEmbed("File d'attente", q)] };
  }
  if (sub === "nowplaying") {
    if (!player?.queue.current) throw new Error("Rien en lecture.");
    return {
      embeds: [buildSimpleEmbed("En lecture", player.queue.current.title)],
      components: musicManager.playerControls(guildId),
    };
  }
  if (sub === "volume") {
    if (!player) throw new Error("Aucune lecture.");
    const vol = interaction.options.getInteger("level", true);
    player.setVolume(Math.max(0, Math.min(200, vol)) / 100);
    return { embeds: [successEmbed("Volume", `Réglé à **${vol}%**.`)] };
  }
  if (sub === "loop") {
    const mode = interaction.options.getString("mode", true) as LoopMode;
    musicManager.setLoop(guildId, mode);
    return { embeds: [successEmbed("Loop", `Mode **${mode}**.`)] };
  }
  if (sub === "seek") {
    if (!player) throw new Error("Aucune lecture.");
    const seconds = interaction.options.getInteger("seconds", true);
    musicManager.seek(guildId, seconds * 1000);
    return { embeds: [successEmbed("Seek", `Position **${seconds}s**.`)] };
  }
  if (sub === "shuffle") {
    if (!player) throw new Error("Aucune lecture.");
    const n = musicManager.shuffle(guildId);
    return { embeds: [successEmbed("Shuffle", `File mélangée (**${n}** pistes).`)] };
  }
  if (sub === "247") {
    const enabled = interaction.options.getBoolean("enabled", true);
    musicManager.set247(guildId, enabled);
    return {
      embeds: [
        successEmbed(
          "24/7",
          enabled
            ? "Le bot reste en vocal même sans piste."
            : "Le bot quitte le vocal quand la file est vide.",
        ),
      ],
    };
  }
  throw new Error("Sous-commande inconnue.");
}
