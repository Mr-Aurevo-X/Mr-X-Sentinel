import type {
  ChatInputCommandInteraction,
  Interaction,
  InteractionReplyOptions,
  MessageComponentInteraction,
} from "discord.js";
import { getGuildConfig } from "@sentinel/database";
import type { GuildFeatures } from "@sentinel/shared";
import { isModuleEnabled, economyAntiCheat } from "@sentinel/core";
import { parseCustomId } from "@sentinel/shared";
import { errorEmbed, loadingEmbed, buildModuleDisabledEmbed } from "../ui/embeds.js";

const ECO_UI_MODULES = new Set(["eco", "economy", "fun", "bj", "minijeu"]);

export type CommandReply = Pick<InteractionReplyOptions, "embeds" | "components" | "content">;

export type CommandHandler = (
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
) => Promise<CommandReply | void>;

export type CommandOptions = {
  defer?: boolean;
  ephemeral?: boolean;
  module?: keyof GuildFeatures;
  loadingTitle?: string;
  skipDefer?: boolean;
};

export async function replyPayload(
  interaction: ChatInputCommandInteraction,
  payload: CommandReply,
  ephemeral = true,
): Promise<void> {
  const opts: InteractionReplyOptions = { ...payload };
  if (!opts.embeds?.length && payload.content) {
    opts.embeds = [errorEmbed("Erreur", payload.content)];
    delete opts.content;
  }
  if (interaction.deferred || interaction.replied) {
    const { flags, ...editOpts } = opts;
    await interaction.editReply(editOpts);
  } else {
    await interaction.reply({ ...opts, ephemeral });
  }
}

export function withCommand(
  handler: CommandHandler,
  options: CommandOptions = {},
): (interaction: ChatInputCommandInteraction, client: import("discord.js").Client) => Promise<void> {
  const { defer = true, ephemeral = true, module, loadingTitle, skipDefer = false } = options;

  return async (interaction, client) => {
    if (module) {
      const features = (await getGuildConfig(interaction.guild!.id)).features;
      if (!isModuleEnabled(features, module)) {
        await interaction.reply({
          embeds: [buildModuleDisabledEmbed(module)],
          ephemeral: true,
        });
        return;
      }
    }

    try {
      await economyAntiCheat.checkRateLimit(
        interaction.guild!.id,
        interaction.user.id,
        interaction.commandName,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Rate limit";
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ embeds: [errorEmbed("Anti-spam économie", msg)], ephemeral: true });
      }
      return;
    }

    const shouldDefer = defer && !skipDefer;
    if (shouldDefer && !interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral });
      if (loadingTitle) {
        await interaction.editReply({ embeds: [loadingEmbed(loadingTitle)] });
      }
    }

    try {
      const result = await handler(interaction, client);
      if (!result) return;
      await replyPayload(interaction, result, ephemeral);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      const denied =
        msg.includes("Permission refusée") || msg.includes("Réservé au") || msg.includes("Réservé au propriétaire");
      const embed = denied ? errorEmbed("Accès refusé", msg) : errorEmbed("Erreur", msg);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral });
      }
    }
  };
}

export async function withComponent(
  interaction: MessageComponentInteraction,
  fn: () => Promise<void>,
): Promise<void> {
  if (interaction.guild) {
    const parsed = parseCustomId(interaction.customId);
    if (parsed && ECO_UI_MODULES.has(parsed.module)) {
      try {
        await economyAntiCheat.checkRateLimit(
          interaction.guild.id,
          interaction.user.id,
          `ui:${parsed.module}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Rate limit";
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({ embeds: [errorEmbed("Anti-spam économie", msg)], ephemeral: true });
        }
        return;
      }
    }
  }

  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    const denied =
      msg.includes("Permission refusée") || msg.includes("Réservé au") || msg.includes("Réservé au propriétaire");
    const embed = denied ? errorEmbed("Accès refusé", msg) : errorEmbed("Erreur", msg);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed] }).catch(() => undefined);
    } else if (interaction.isMessageComponent()) {
      await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => undefined);
    }
  }
}

export function isGuildInteraction(
  interaction: Interaction,
): interaction is ChatInputCommandInteraction & { guild: NonNullable<ChatInputCommandInteraction["guild"]> } {
  return interaction.isChatInputCommand() && interaction.guild != null;
}
