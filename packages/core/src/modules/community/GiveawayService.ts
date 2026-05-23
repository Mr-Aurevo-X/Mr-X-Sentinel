import { prisma } from "@sentinel/database";
import type { Client, TextChannel } from "discord.js";
import { COLORS } from "@sentinel/shared";

export class GiveawayService {
  async create(channel: TextChannel, creatorId: string, prize: string, durationHours: number, winners = 1) {
    const endsAt = new Date(Date.now() + durationHours * 3_600_000);
    const row = await prisma.giveaway.create({
      data: {
        guildId: channel.guild.id,
        channelId: channel.id,
        prize,
        winners,
        endsAt,
        creatorId,
      },
    });
    const msg = await channel.send({
      embeds: [
        {
          color: COLORS.economy,
          title: "🎉 Giveaway",
          description: `**Prix :** ${prize}\n**Gagnants :** ${winners}\n**Fin :** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n\nClique sur 🎉 pour participer !`,
          footer: { text: "Mr-X Sentinel" },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    await msg.react("🎉").catch(() => undefined);
    await prisma.giveaway.update({ where: { id: row.id }, data: { messageId: msg.id } });
    return row;
  }

  async enter(giveawayId: string, userId: string) {
    const g = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!g || g.ended || g.endsAt.getTime() < Date.now()) return false;
    const entries = (g.entries as string[]) ?? [];
    if (entries.includes(userId)) return true;
    entries.push(userId);
    await prisma.giveaway.update({ where: { id: giveawayId }, data: { entries } });
    return true;
  }

  async end(client: Client, giveawayId: string) {
    const g = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!g || g.ended) return null;
    const entries = [...new Set((g.entries as string[]) ?? [])];
    const shuffled = entries.sort(() => Math.random() - 0.5);
    const winnerIds = shuffled.slice(0, Math.max(1, g.winners));
    await prisma.giveaway.update({
      where: { id: giveawayId },
      data: { ended: true, winnerIds },
    });
    const ch = await client.channels.fetch(g.channelId).catch(() => null);
    if (ch?.isTextBased() && "send" in ch && g.messageId) {
      const winnersText = winnerIds.length ? winnerIds.map((id) => `<@${id}>`).join(", ") : "Aucun participant";
      await ch
        .send({
          embeds: [
            {
              color: COLORS.success,
              title: "🎉 Giveaway terminé",
              description: `**Prix :** ${g.prize}\n**Gagnant(s) :** ${winnersText}`,
              footer: { text: "Mr-X Sentinel" },
            },
          ],
        })
        .catch(() => undefined);
    }
    return winnerIds;
  }

  async tick(client: Client) {
    const due = await prisma.giveaway.findMany({
      where: { ended: false, endsAt: { lte: new Date() } },
      take: 10,
    });
    for (const g of due) await this.end(client, g.id);
  }

  async listActive(guildId: string) {
    return prisma.giveaway.findMany({ where: { guildId, ended: false }, orderBy: { endsAt: "asc" } });
  }
}

export const giveawayService = new GiveawayService();
