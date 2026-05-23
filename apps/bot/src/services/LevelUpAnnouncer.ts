import type { Client, Guild, Role, TextChannel } from "discord.js";

import { getGuildConfig, prisma } from "@sentinel/database";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { customId } from "@sentinel/shared";

import { levelsService, logService } from "@sentinel/core";

import { buildLevelUpEmbed } from "../ui/embeds.js";



export type LevelUpExtras = {

  gainedXp?: number;

  streakMultiplier?: number;

  streakDays?: number;

  unlockedRole?: Role | null;

};



export class LevelUpAnnouncer {

  async announce(

    client: Client,

    guild: Guild,

    userId: string,

    level: number,

    xp: number,

    extras: LevelUpExtras = {},

  ): Promise<void> {

    const member = await guild.members.fetch(userId).catch(() => null);

    const displayName = member?.displayName ?? member?.user.username ?? "Membre";

    const avatarUrl = member?.displayAvatarURL() ?? null;

    const { progress, needed } = levelsService.getProgress(xp, level);



    const embed = buildLevelUpEmbed(displayName, level, avatarUrl, progress, needed, {

      gainedXp: extras.gainedXp,

      streakMultiplier: extras.streakMultiplier,

      unlockedRoleName: extras.unlockedRole?.name,

    });

    const xpRow = await prisma.userXp.findUnique({
      where: { guildId_userId: { guildId: guild.id, userId } },
    });
    const pingEnabled = xpRow?.levelUpPing ?? true;
    const ping = pingEnabled ? `<@${userId}>` : "";

    const cfg = await getGuildConfig(guild.id);
    const pingRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("levels", "ping_toggle", userId))
        .setLabel(pingEnabled ? "Désactiver le ping level-up" : "Activer le ping level-up")
        .setStyle(ButtonStyle.Secondary),
    );

    let announced = false;



    if (cfg.levels.levelUpChannelId) {

      announced = await this.sendToChannel(guild, cfg.levels.levelUpChannelId, ping, embed, [pingRow]);

    }



    if (!announced) {

      const logsChannelId = await logService.resolveChannelId(guild.id, "levels");

      if (logsChannelId) {

        await this.sendToChannel(guild, logsChannelId, ping, embed, [pingRow]);

      }

    }



    await logService.log(client, guild.id, "levels", {

      title: "Level up",

      description: `${displayName} → niveau **${level}**${extras.unlockedRole ? ` · ${extras.unlockedRole.name}` : ""}`,

      actorId: userId,

    });

  }



  private async sendToChannel(

    guild: Guild,

    channelId: string,

    content: string,

    embed: ReturnType<typeof buildLevelUpEmbed>,
    components?: ActionRowBuilder<ButtonBuilder>[],
  ): Promise<boolean> {

    const ch =

      (guild.channels.cache.get(channelId) as TextChannel | undefined) ??

      ((await guild.channels.fetch(channelId).catch(() => null)) as TextChannel | null);

    if (!ch?.isTextBased() || ch.isDMBased()) return false;

    await ch.send({ content: content || undefined, embeds: [embed], components }).catch(() => undefined);

    return true;

  }

}



export const levelUpAnnouncer = new LevelUpAnnouncer();

