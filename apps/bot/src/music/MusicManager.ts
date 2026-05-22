import { Kazagumo, KazagumoPlayer } from "kazagumo";
import { Connectors } from "shoukaku";
import type { VoiceBasedChannel } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { customId, BRAND_COLOR } from "@sentinel/shared";
import { logService } from "@sentinel/core";
import type { Client as DjsClient } from "discord.js";

const LAVALINK_HOST = process.env.LAVALINK_HOST ?? "localhost";
const LAVALINK_PORT = process.env.LAVALINK_PORT ?? "2333";
const LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD ?? "youshallnotpass";

export class MusicManager {
  kazagumo: Kazagumo | null = null;

  async init(client: DjsClient): Promise<void> {
    const nodes = [
      {
        name: "main",
        url: `${LAVALINK_HOST}:${LAVALINK_PORT}`,
        auth: LAVALINK_PASSWORD,
        secure: false,
      },
    ];
    this.kazagumo = new Kazagumo(
      {
        defaultSearchEngine: "youtube",
        plugins: [],
        send: (guildId, payload) => {
          const guild = client.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
      },
      new Connectors.DiscordJS(client),
      nodes,
    );
    this.kazagumo.on("playerEnd", (player) => {
      if (!player.queue.length) player.destroy();
    });
  }

  getPlayer(guildId: string): KazagumoPlayer | undefined {
    return this.kazagumo?.players.get(guildId);
  }

  playerControls(guildId: string): ActionRowBuilder<ButtonBuilder>[] {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(customId("music", "pause", guildId))
          .setLabel("Pause")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(customId("music", "skip", guildId))
          .setLabel("Skip")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(customId("music", "stop", guildId))
          .setLabel("Stop")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(customId("music", "queue", guildId))
          .setLabel("Queue")
          .setStyle(ButtonStyle.Secondary),
      ),
    ];
  }

  async play(
    client: DjsClient,
    voiceChannel: VoiceBasedChannel,
    query: string,
    requesterId: string,
    textChannelId: string,
  ): Promise<{ embed: EmbedBuilder }> {
    if (!this.kazagumo) throw new Error("Lavalink non initialisé (docker compose up).");
    const guildId = voiceChannel.guild.id;
    let player = this.getPlayer(guildId);
    if (!player) {
      player = await this.kazagumo.createPlayer({
        guildId,
        voiceId: voiceChannel.id,
        textId: textChannelId,
        volume: 80,
        deaf: true,
      });
    } else if (player.voiceId !== voiceChannel.id) {
      await player.setVoiceChannel(voiceChannel.id);
    }

    const result = await this.kazagumo.search(query, { requester: requesterId });
    if (!result.tracks.length) throw new Error("Aucune piste trouvée.");

    const track = result.tracks[0]!;
    player.queue.add(track);
    if (!player.playing) await player.play();

    await logService.log(client, guildId, "music", {
      title: "Lecture",
      description: `**${track.title}** — <@${requesterId}>`,
      actorId: requesterId,
    });

    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("En lecture")
      .setDescription(`[${track.title}](${track.uri})`)
      .setFooter({ text: `Demandé par ${requesterId}` });

    return { embed };
  }
}

export const musicManager = new MusicManager();
