import { Kazagumo, KazagumoPlayer } from "kazagumo";
import { Connectors } from "shoukaku";
import type { VoiceBasedChannel } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { assertSafePlayQuery, customId, BRAND_COLOR } from "@sentinel/shared";
import { logService } from "@sentinel/core";
import type { Client as DjsClient } from "discord.js";

const LAVALINK_HOST = process.env.LAVALINK_HOST ?? "localhost";
const LAVALINK_PORT = process.env.LAVALINK_PORT ?? "2333";

export type LoopMode = "off" | "track" | "queue";

export class MusicManager {
  kazagumo: Kazagumo | null = null;
  private stay247 = new Map<string, boolean>();
  private loopMode = new Map<string, LoopMode>();

  async init(client: DjsClient): Promise<void> {
    const password = process.env.LAVALINK_PASSWORD;
    if (!password) {
      throw new Error("LAVALINK_PASSWORD is required (no default)");
    }
    const nodes = [
      {
        name: "main",
        url: `${LAVALINK_HOST}:${LAVALINK_PORT}`,
        auth: password,
        secure: false,
      },
    ];
    this.kazagumo = new Kazagumo(
      {
        defaultSearchEngine: "youtube",
        plugins: [],
        // keep existing options below
        send: (guildId, payload) => {
          const guild = client.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
      },
      new Connectors.DiscordJS(client),
      nodes,
    );
    this.kazagumo.on("playerEnd", (player) => {
      const guildId = player.guildId;
      const loop = this.loopMode.get(guildId) ?? "off";
      if (loop === "track" && player.queue.current) {
        void player.play(player.queue.current);
        return;
      }
      if (loop === "queue" && player.queue.current) {
        player.queue.add(player.queue.current);
      }
      if (player.queue.length) {
        void player.play();
        return;
      }
      if (this.stay247.get(guildId)) {
        return;
      }
      player.destroy();
    });
  }

  getPlayer(guildId: string): KazagumoPlayer | undefined {
    return this.kazagumo?.players.get(guildId);
  }

  set247(guildId: string, enabled: boolean): void {
    this.stay247.set(guildId, enabled);
  }

  get247(guildId: string): boolean {
    return this.stay247.get(guildId) ?? false;
  }

  setLoop(guildId: string, mode: LoopMode): void {
    this.loopMode.set(guildId, mode);
    const player = this.getPlayer(guildId);
    if (player && typeof (player as { setLoop?: (m: string) => void }).setLoop === "function") {
      const map = { off: "none", track: "track", queue: "queue" } as const;
      try {
        (player as { setLoop: (m: string) => void }).setLoop(map[mode]);
      } catch {
        /* kazagumo version may differ */
      }
    }
  }

  getLoop(guildId: string): LoopMode {
    return this.loopMode.get(guildId) ?? "off";
  }

  shuffle(guildId: string): number {
    const player = this.getPlayer(guildId);
    if (!player) return 0;
    const q = player.queue as unknown as { shuffle?: () => void; length: number };
    if (typeof q.shuffle === "function") {
      q.shuffle();
      return q.length;
    }
    // fallback: manual shuffle via array if exposed
    const tracks = [...player.queue];
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks[i], tracks[j]] = [tracks[j]!, tracks[i]!];
    }
    player.queue.clear();
    for (const t of tracks) player.queue.add(t);
    return tracks.length;
  }

  seek(guildId: string, positionMs: number): void {
    const player = this.getPlayer(guildId);
    if (!player) throw new Error("Aucune lecture.");
    player.seek(Math.max(0, positionMs));
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
        new ButtonBuilder()
          .setCustomId(customId("music", "shuffle", guildId))
          .setLabel("Shuffle")
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
    assertSafePlayQuery(query);
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
