import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { ChannelType } from "discord.js";
import { getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { successEmbed, buildSimpleEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleBirthday(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const cfg = await getGuildConfig(guildId);

  if (sub === "set") {
    const day = interaction.options.getInteger("day", true);
    const month = interaction.options.getInteger("month", true);
    const stamp = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await updateGuildConfig(guildId, {
      birthday: {
        ...cfg.birthday,
        entries: { ...cfg.birthday.entries, [interaction.user.id]: stamp },
      },
    });
    return { embeds: [successEmbed("Anniversaire", `Enregistré : **${stamp}** (MM-JJ).`)] };
  }
  if (sub === "remove") {
    const entries = { ...cfg.birthday.entries };
    delete entries[interaction.user.id];
    await updateGuildConfig(guildId, { birthday: { ...cfg.birthday, entries } });
    return { embeds: [successEmbed("Anniversaire", "Supprimé.")] };
  }
  if (sub === "channel") {
    const member = interaction.member as GuildMember;
    if (!member.permissions.has("Administrator")) throw new Error("Admin requis.");
    const channel = interaction.options.getChannel("channel", true);
    await updateGuildConfig(guildId, {
      birthday: { ...cfg.birthday, channelId: channel.id },
    });
    return { embeds: [successEmbed("Anniversaire", `Salon : <#${channel.id}>.`)] };
  }
  throw new Error("Sous-commande inconnue.");
}

export async function handleTempVc(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  const member = interaction.member as GuildMember;
  if (!member.permissions.has("Administrator")) throw new Error("Admin requis.");
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "hub") {
    const channel = interaction.options.getChannel("channel", true);
    if (channel.type !== ChannelType.GuildVoice) throw new Error("Salon vocal requis.");
    await updateGuildConfig(guildId, {
      tempVoice: { hubChannelId: channel.id },
    });
    return {
      embeds: [
        successEmbed(
          "Temp VC",
          `Hub : <#${channel.id}>. Rejoindre ce salon crée un vocal temporaire.`,
        ),
      ],
    };
  }
  if (sub === "off") {
    await updateGuildConfig(guildId, { tempVoice: { hubChannelId: null } });
    return { embeds: [successEmbed("Temp VC", "Désactivé.")] };
  }
  throw new Error("Sous-commande inconnue.");
}

export async function handleCounting(
  interaction: ChatInputCommandInteraction,
): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const cfg = await getGuildConfig(guildId);

  if (sub === "status") {
    return {
      embeds: [
        buildSimpleEmbed(
          "Compteur",
          cfg.counting.channelId
            ? `Salon <#${cfg.counting.channelId}>\nProchain : **${cfg.counting.nextNumber}**\nRecord : **${cfg.counting.highScore}**`
            : "Non configuré (`/counting setup`).",
        ),
      ],
    };
  }

  const member = interaction.member as GuildMember;
  if (!member.permissions.has("Administrator")) throw new Error("Admin requis.");

  if (sub === "setup") {
    const channel = interaction.options.getChannel("channel", true);
    await updateGuildConfig(guildId, {
      counting: {
        channelId: channel.id,
        nextNumber: 1,
        lastUserId: null,
        highScore: cfg.counting.highScore,
      },
    });
    return {
      embeds: [successEmbed("Compteur", `Salon <#${channel.id}> ? commencez ? **1**.`)],
    };
  }
  if (sub === "off") {
    await updateGuildConfig(guildId, {
      counting: { channelId: null, nextNumber: 1, lastUserId: null, highScore: cfg.counting.highScore },
    });
    return { embeds: [successEmbed("Compteur", "Désactivé.")] };
  }
  throw new Error("Sous-commande inconnue.");
}
