import { prisma } from "@sentinel/database";
import type { Client, TextChannel } from "discord.js";
import { COLORS } from "@sentinel/shared";

export class PollService {
  async create(
    channel: TextChannel,
    creatorId: string,
    question: string,
    options: string[],
    durationHours?: number,
  ) {
    if (options.length < 2) throw new Error("Un sondage nécessite au moins 2 options.");
    if (options.length > 10) throw new Error("Un sondage est limité à 10 options.");
    const endsAt = durationHours ? new Date(Date.now() + durationHours * 3_600_000) : null;
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const lines = options.map((o, i) => `${emojis[i]} ${o}`).join("\n");
    const msg = await channel.send({
      embeds: [
        {
          color: COLORS.brand,
          title: "📊 Sondage",
          description: `**${question}**\n\n${lines}`,
          footer: { text: endsAt ? `Fin <t:${Math.floor(endsAt.getTime() / 1000)}:R>` : "Mr-X Sentinel" },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    for (let i = 0; i < options.length; i++) {
      await msg.react(emojis[i]!).catch(() => undefined);
    }
    return prisma.poll.create({
      data: {
        guildId: channel.guild.id,
        channelId: channel.id,
        messageId: msg.id,
        question,
        options,
        endsAt,
        createdBy: creatorId,
      },
    });
  }

  async list(guildId: string) {
    return prisma.poll.findMany({ where: { guildId }, orderBy: { createdAt: "desc" }, take: 20 });
  }

  async tick(client: Client): Promise<void> {
    const due = await prisma.poll.findMany({
      where: { ended: false, endsAt: { not: null, lte: new Date() } },
      take: 10,
    });
    for (const poll of due) {
      await this.close(client, poll.id);
    }
  }

  async close(client: Client, pollId: string): Promise<void> {
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll || poll.ended) return;
    await prisma.poll.update({ where: { id: poll.id }, data: { ended: true } });

    const channel = await client.channels.fetch(poll.channelId).catch(() => null);
    if (!channel?.isTextBased() || !("messages" in channel)) return;
    const message = await channel.messages.fetch(poll.messageId).catch(() => null);
    if (!message) return;

    const options = poll.options as string[];
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const tallies = options.map((option, index) => {
      const count = message.reactions.cache.get(emojis[index]!)?.count ?? 1;
      return { option, votes: Math.max(0, count - 1) };
    });
    const winner = [...tallies].sort((a, b) => b.votes - a.votes)[0];
    const lines = tallies.map((row) => `• **${row.option}** — ${row.votes}`).join("\n");

    await message
      .edit({
        embeds: [
          {
            color: COLORS.success,
            title: "Sondage terminé",
            description: `**${poll.question}**\n\n${lines}\n\nGagnant : **${winner?.option ?? "—"}**`,
            footer: { text: "Mr-X Sentinel" },
          },
        ],
      })
      .catch(() => undefined);
    await message.reactions.removeAll().catch(() => undefined);
  }
}

export const pollService = new PollService();
