import { prisma } from "@sentinel/database";
import type { TextChannel } from "discord.js";
import { COLORS } from "@sentinel/shared";

export class PollService {
  async create(
    channel: TextChannel,
    creatorId: string,
    question: string,
    options: string[],
    durationHours?: number,
  ) {
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
}

export const pollService = new PollService();
