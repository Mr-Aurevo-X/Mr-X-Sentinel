import type { Guild, Role, Emoji, NonThreadGuildBasedChannel } from "discord.js";
import type { SnapshotPayload, SnapshotChannel, SnapshotRole, SnapshotEmoji } from "@sentinel/shared";
import { getOrCreateGuild, prisma } from "@sentinel/database";
import { AUTO_SNAPSHOT_KEEP } from "./snapshotPrune.js";

export class SnapshotService {
  async capture(guild: Guild, label = "auto"): Promise<string> {
    const roles: SnapshotRole[] = guild.roles.cache
      .filter((r: Role) => !r.managed && r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        position: r.position,
        permissions: r.permissions.bitfield.toString(),
        mentionable: r.mentionable,
        managed: r.managed,
      }));

    const channels: SnapshotChannel[] = guild.channels.cache
      .filter((c): c is NonThreadGuildBasedChannel => !c.isThread())
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parentId,
        position: "position" in c ? c.position : 0,
        topic: "topic" in c && c.topic ? c.topic : null,
        nsfw: "nsfw" in c ? c.nsfw : false,
        rateLimitPerUser: "rateLimitPerUser" in c ? c.rateLimitPerUser ?? 0 : 0,
        permissionOverwrites: [...c.permissionOverwrites.cache.values()].map((o) => ({
          id: o.id,
          type: o.type,
          allow: o.allow.bitfield.toString(),
          deny: o.deny.bitfield.toString(),
        })),
      }));

    const emojis: SnapshotEmoji[] = guild.emojis.cache
      .filter((e: Emoji) => e.id !== null)
      .map((e) => ({
        id: e.id!,
        name: e.name ?? "emoji",
        animated: e.animated ?? false,
      }));

    const payload: SnapshotPayload = {
      version: 1,
      guildId: guild.id,
      guildName: guild.name,
      createdAt: new Date().toISOString(),
      roles,
      channels,
      emojis,
    };

    const json = JSON.stringify(payload);
    await getOrCreateGuild(guild.id);
    const record = await prisma.snapshot.create({
      data: {
        guildId: guild.id,
        label,
        payload: payload as object,
        sizeBytes: Buffer.byteLength(json),
      },
    });

    if (label === "auto") {
      await this.pruneAuto(guild.id);
    }

    return record.id;
  }

  private async pruneAuto(guildId: string): Promise<void> {
    const stale = await prisma.snapshot.findMany({
      where: { guildId, label: "auto" },
      orderBy: { createdAt: "desc" },
      skip: AUTO_SNAPSHOT_KEEP,
      select: { id: true },
    });
    if (stale.length === 0) return;
    await prisma.snapshot.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
  }

  async list(guildId: string, limit = 20) {
    return prisma.snapshot.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, label: true, createdAt: true, sizeBytes: true },
    });
  }
}

export const snapshotService = new SnapshotService();
