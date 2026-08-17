import {
  ChannelType,
  Events,
  PermissionFlagsBits,
  type Client,
  type Message,
  type MessageReaction,
  type TextChannel,
  type VoiceState,
} from "discord.js";
import { getGuildConfig, updateGuildConfig, prisma } from "@sentinel/database";
import { buildSimpleEmbed } from "../ui/embeds.js";

/** channelId -> owner userId for temp VCs created by the bot */
const tempVoiceOwned = new Map<string, string>();

export function registerCommunityListeners(client: Client): void {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    await handleSpamRelay(message);
    await handleAfkMentions(message);
    await handleCounting(message);
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => undefined);
    await handleStarboard(reaction as MessageReaction, client);
  });

  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    await handleTempVoice(oldState, newState);
  });

  setInterval(() => {
    void tickReminders(client);
    void tickBirthdays(client);
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

async function handleCounting(message: Message): Promise<void> {
  const cfg = await getGuildConfig(message.guild!.id);
  if (!cfg.counting.channelId || message.channelId !== cfg.counting.channelId) return;
  const content = message.content.trim();
  if (!/^\d+$/.test(content)) {
    await message.delete().catch(() => undefined);
    return;
  }
  const n = Number(content);
  if (message.author.id === cfg.counting.lastUserId || n !== cfg.counting.nextNumber) {
    await message.react("❌").catch(() => undefined);
    const high = Math.max(cfg.counting.highScore, cfg.counting.nextNumber - 1);
    await updateGuildConfig(message.guild!.id, {
      counting: {
        ...cfg.counting,
        nextNumber: 1,
        lastUserId: null,
        highScore: high,
      },
    });
    if (message.channel.isTextBased() && !message.channel.isDMBased()) {
      await message.channel
        .send(`Compteur cassé par <@${message.author.id}> ! Record : **${high}**. Recommencez à **1**.`)
        .catch(() => undefined);
    }
    return;
  }
  await message.react("✅").catch(() => undefined);
  const next = n + 1;
  await updateGuildConfig(message.guild!.id, {
    counting: {
      ...cfg.counting,
      nextNumber: next,
      lastUserId: message.author.id,
      highScore: Math.max(cfg.counting.highScore, n),
    },
  });
}

async function handleTempVoice(oldState: VoiceState, newState: VoiceState): Promise<void> {
  const guild = newState.guild ?? oldState.guild;
  if (!guild) return;
  const cfg = await getGuildConfig(guild.id);
  const hubId = cfg.tempVoice.hubChannelId;
  if (!hubId) return;

  // Create temp VC when joining hub
  if (newState.channelId === hubId && newState.member && !newState.member.user.bot) {
    const parent = newState.channel?.parentId ?? undefined;
    const created = await guild.channels
      .create({
        name: `🔊 ${newState.member.displayName}`.slice(0, 100),
        type: ChannelType.GuildVoice,
        parent,
        permissionOverwrites: [
          {
            id: newState.member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.Connect,
            ],
          },
        ],
      })
      .catch(() => null);
    if (created) {
      tempVoiceOwned.set(created.id, newState.member.id);
      await newState.member.voice.setChannel(created.id).catch(() => undefined);
    }
  }

  // Delete empty temp VCs
  const leftId = oldState.channelId;
  if (leftId && tempVoiceOwned.has(leftId) && leftId !== hubId) {
    const ch = oldState.channel;
    if (ch && ch.members.size === 0) {
      tempVoiceOwned.delete(leftId);
      await ch.delete("Temp VC vide").catch(() => undefined);
    }
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

let lastBirthdayDay = "";

export async function tickBirthdays(client: Client): Promise<void> {
  const now = new Date();
  const key = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
  if (key === lastBirthdayDay) return;
  // run once per day around noon UTC window when interval hits
  if (now.getUTCHours() !== 12) return;
  lastBirthdayDay = key;
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const stamp = `${mm}-${dd}`;

  for (const guild of client.guilds.cache.values()) {
    const cfg = await getGuildConfig(guild.id);
    if (!cfg.birthday.channelId) continue;
    const hits = Object.entries(cfg.birthday.entries).filter(([, v]) => v === stamp);
    if (!hits.length) continue;
    const ch = await guild.channels.fetch(cfg.birthday.channelId).catch(() => null);
    if (!ch?.isTextBased() || ch.isDMBased()) continue;
    const mentions = hits.map(([uid]) => `<@${uid}>`).join(" ");
    await ch
      .send({ content: `🎂 Joyeux anniversaire ${mentions} !` })
      .catch(() => undefined);
  }
}
