import type { ChatInputCommandInteraction } from "discord.js";
import { buildSimpleEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handlePing(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const rtt = Date.now() - interaction.createdTimestamp;
  const ws = interaction.client.ws.ping;
  return {
    embeds: [
      buildSimpleEmbed(
        "🏓 Pong",
        `Latence API : **${rtt} ms**\nWebSocket : **${ws} ms**`,
        0x57f287,
      ),
    ],
  };
}

export async function handleBotInfo(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const client = interaction.client;
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
  const mem = process.memoryUsage().heapUsed / 1024 / 1024;
  const started = Math.floor((Date.now() - (client.uptime ?? 0)) / 1000);
  return {
    embeds: [
      buildSimpleEmbed(
        "🤖 Mr-X Sentinel",
        [
          `Serveurs : **${guilds}**`,
          `Membres (approx.) : **${users.toLocaleString("fr-FR")}**`,
          `Node : **${process.version}**`,
          `RAM : **${mem.toFixed(1)} Mo**`,
          `En ligne depuis : <t:${started}:R>`,
        ].join("\n"),
        0x5865f2,
      ),
    ],
  };
}

export async function handleServerInfo(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const guild = interaction.guild!;
  const owner = await guild.fetchOwner();
  return {
    embeds: [
      buildSimpleEmbed(
        `Serveur — ${guild.name}`,
        [
          `ID : \`${guild.id}\``,
          `Propriétaire : ${owner.user.tag}`,
          `Membres : **${guild.memberCount}**`,
          `Créé : <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          `Boost : **${guild.premiumSubscriptionCount ?? 0}**`,
        ].join("\n"),
        0x5865f2,
      ),
    ],
  };
}

export async function handleAvatar(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const user = interaction.options.getUser("user") ?? interaction.user;
  return {
    embeds: [
      buildSimpleEmbed(`Avatar — ${user.username}`, `[Lien](${user.displayAvatarURL({ size: 512 })})`, 0x5865f2),
    ],
  };
}

export async function handleUserInfo(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const target =
    interaction.options.getUser("user") ??
    interaction.user;
  const member = interaction.guild?.members.cache.get(target.id);
  const created = `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`;
  const joined = member?.joinedAt
    ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
    : "—";
  const roles =
    member?.roles.cache
      .filter((r) => r.id !== interaction.guild!.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.toString())
      .slice(0, 12)
      .join(" ") || "—";

  return {
    embeds: [
      buildSimpleEmbed(
        `👤 ${target.tag}`,
        [
          `ID : \`${target.id}\``,
          `Compte créé : ${created}`,
          `A rejoint : ${joined}`,
          member ? `Rôles (${member.roles.cache.size - 1}) : ${roles}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        0x5865f2,
      ),
    ],
  };
}
