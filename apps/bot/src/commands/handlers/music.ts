import type { ChatInputCommandInteraction } from "discord.js";
import { musicManager } from "../../music/MusicManager.js";
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
  throw new Error("Sous-commande inconnue.");
}
