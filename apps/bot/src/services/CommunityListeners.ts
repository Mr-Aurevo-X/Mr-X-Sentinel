import {
  ChannelType,
  Events,
  type Client,
  type Message,
  type MessageReaction,
  type TextChannel,
} from "discord.js";
import { getGuildConfig, prisma } from "@sentinel/database";
import { buildSimpleEmbed } from "../ui/embeds.js";

export function registerCommunityListeners(client: Client): void {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    await handleSpamRelay(message);
    await handleAfkMentions(message);
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    await updateMemberCounter(client, member.guild.id, member.guild.memberCount);
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => undefined);
    await handleStarboard(reaction as MessageReaction, client);
  });

  setInterval(() => {
    void tickReminders(client);
  }, 30_000);
}

export async function updateMemberCounter(
  client: Client,
  guildId: string,
  memberCount: number,
): Promise<void> {
  const cfg = await getGuildConfig(guildId);
  const channelId = cfg.channels.counterChannelId;
  if (!channelId) return;
  const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId).catch(() => null));
  if (!guild) return;
  const ch = await guild.channels.fetch(channelId).catch(() => null);
  if (!ch || (ch.type !== ChannelType.GuildVoice && ch.type !== ChannelType.GuildText)) return;
  const name = cfg.channels.counterTemplate.replace("{count}", String(memberCount)).slice(0, 100);
  await ch.setName(name).catch(() => undefined);
}

async function handleSpamRelay(message: Message): Promise<void> {
  const cfg = await getGuildConfig(message.guild!.id);
  const targetId = cfg.channels.spamChannelId;
  if (!targetId || message.channelId === targetId) return;
  const target = message.guild!.channels.cache.get(targetId);
  if (!target?.isTextBased() || target.isDMBased()) return;
  const preview = message.content?.slice(0, 1800) || "(pièce jointe / embed)";
  await target
    .send({
      embeds: [
        buildSimpleEmbed(
          "Relay spam",
          `**${message.author.tag}** dans <#${message.channelId}>\n${preview}`,
        ),
      ],
    })
    .catch(() => undefined);
}

async function handleAfkMentions(message: Message): Promise<void> {
  if (!message.mentions.users.size) return;
  for (const user of message.mentions.users.values()) {
    if (user.bot) continue;
    const afk = await prisma.afkStatus.findUnique({
      where: { guildId_userId: { guildId: message.guild!.id, userId: user.id } },
    });
    if (!afk) continue;
    await message
      .reply({
        content: `<@${user.id}> est AFK : **${afk.reason}**`,
        allowedMentions: { users: [user.id] },
      })
      .catch(() => undefined);
  }
  const authorAfk = await prisma.afkStatus.findUnique({
    where: { guildId_userId: { guildId: message.guild!.id, userId: message.author.id } },
  });
  if (authorAfk) {
    await prisma.afkStatus.deleteMany({
      where: { guildId: message.guild!.id, userId: message.author.id },
    });
  }
}

async function handleStarboard(reaction: MessageReaction, client: Client): Promise<void> {
  if (!reaction.message.guild) return;
  if (reaction.partial) await reaction.fetch().catch(() => undefined);
  if (reaction.emoji.name !== "⭐") return;
  const cfg = await getGuildConfig(reaction.message.guild.id);
  if (!cfg.starboard.enabled || !cfg.starboard.channelId) return;
  const msg = reaction.message.partial
    ? await reaction.message.fetch().catch(() => null)
    : reaction.message;
  if (!msg?.author || msg.author.bot) return;
  const count = msg.reactions.cache.get("⭐")?.count ?? 0;
  if (count < cfg.starboard.threshold) return;
  const starCh = (await client.channels.fetch(cfg.starboard.channelId).catch(() => null)) as
    | TextChannel
    | null;
  if (!starCh?.isTextBased()) return;
  await starCh
    .send({
      embeds: [
        buildSimpleEmbed(
          `⭐ ${count}`,
          `${msg.content?.slice(0, 500) || "(embed)"}\n[Aller au message](${msg.url})`,
        ).setAuthor({
          name: msg.author.tag,
          iconURL: msg.author.displayAvatarURL(),
        }),
      ],
    })
    .catch(() => undefined);
}

export async function tickReminders(client: Client): Promise<void> {
  const due = await prisma.reminder.findMany({
    where: { done: false, dueAt: { lte: new Date() } },
    take: 25,
  });
  for (const r of due) {
    const ch = await client.channels.fetch(r.channelId).catch(() => null);
    if (ch?.isTextBased() && !ch.isDMBased()) {
      await ch
        .send({ content: `<@${r.userId}> ⏰ **Rappel** : ${r.message}` })
        .catch(() => undefined);
    }
    await prisma.reminder.update({ where: { id: r.id }, data: { done: true } });
  }
}
