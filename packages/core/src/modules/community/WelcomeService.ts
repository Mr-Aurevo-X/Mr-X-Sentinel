import type { Client, GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { getGuildConfig } from "@sentinel/database";
import { logService } from "../../services/LogService.js";

const WELCOME_MESSAGES = [
  "✨ {mention} vient d'arriver sur **{server}** !",
  "🎉 Tout le monde souhaite la bienvenue à {mention} !",
  "👋 Hey {mention}, heureux de t'accueillir parmi nous !",
  "🚀 {mention} rejoint l'aventure sur **{server}** !",
  "🥳 {mention} débarque sur **{server}**, faites-lui une place !",
];

const GOODBYE_MESSAGES = [
  "😢 {mention} a quitté **{server}**.",
  "👋 {mention} continue sa route ailleurs.",
  "🌙 {mention} n'est plus parmi nous sur **{server}**.",
];

export class WelcomeService {
  async onMemberJoin(client: Client, member: GuildMember): Promise<void> {
    const cfg = await getGuildConfig(member.guild.id);
    const welcomeId = cfg.welcome.welcomeChannelId;
    const autoRoleId = cfg.welcome.autoRoleId;

    if (autoRoleId) {
      await member.roles.add(autoRoleId, "Mr-X Sentinel auto-role").catch(() => undefined);
    }

    const msg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]!
      .replace("{mention}", member.toString())
      .replace("{server}", member.guild.name);

    if (welcomeId) {
      const ch = member.guild.channels.cache.get(welcomeId) as TextChannel | undefined;
      if (ch?.isTextBased()) {
        await ch
          .send({
            embeds: [
              {
                color: 0x57f287,
                title: "👋 Bienvenue",
                description: msg,
                thumbnail: { url: member.displayAvatarURL() },
                footer: { text: `Membre #${member.guild.memberCount}` },
                timestamp: new Date().toISOString(),
              },
            ],
          })
          .catch(() => undefined);
      }
    }

    await logService.log(client, member.guild.id, "join_leave", {
      title: "Membre rejoint",
      description: `${member.user.tag} (${member.id})`,
      actorId: member.id,
    });
  }

  async onMemberLeave(client: Client, member: GuildMember | PartialGuildMember): Promise<void> {
    if (!member.guild) return;
    const cfg = await getGuildConfig(member.guild.id);
    const goodbyeId = cfg.welcome.goodbyeChannelId;
    const tag = member.user?.tag ?? "Membre";
    const mention = member.user ? `<@${member.id}>` : tag;

    const msg = GOODBYE_MESSAGES[Math.floor(Math.random() * GOODBYE_MESSAGES.length)]!
      .replace("{mention}", mention)
      .replace("{server}", member.guild.name);

    if (goodbyeId) {
      const ch = member.guild.channels.cache.get(goodbyeId) as TextChannel | undefined;
      if (ch?.isTextBased()) {
        await ch
          .send({
            embeds: [
              {
                color: 0xed4245,
                title: "👋 Départ",
                description: msg,
                timestamp: new Date().toISOString(),
              },
            ],
          })
          .catch(() => undefined);
      }
    }

    await logService.log(client, member.guild.id, "join_leave", {
      title: "Membre parti",
      description: `${tag} (${member.id})`,
    });
  }
}

export const welcomeService = new WelcomeService();
