/**
 * Parked: slash /chat (message | reset | mode).
 * Lived in apps/bot/src/commands/index.ts
 */
import type { ChatInputCommandInteraction } from "discord.js";
import { chatCompletion, resetConversation } from "@sentinel/ai";
import { getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { withCommand } from "../../../apps/bot/src/commands/middleware.js";
import { buildSimpleEmbed, successEmbed } from "../../../apps/bot/src/ui/embeds.js";

export async function handleChat(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub === "reset") {
    await resetConversation(interaction.user.id, interaction.guild!.id, {
      channelId: interaction.channelId,
      threadId: interaction.channel?.isThread() ? interaction.channel.id : null,
    });
    await interaction.reply({
      embeds: [successEmbed("IA", "Conversation réinitialisée.")],
      ephemeral: true,
    });
    return;
  }
  if (sub === "mode") {
    const context = interaction.options.getString("context", true) as "user" | "channel" | "thread";
    const cfg = await getGuildConfig(interaction.guild!.id);
    await updateGuildConfig(interaction.guild!.id, {
      ai: { ...cfg.ai, contextMode: context },
    });
    await interaction.reply({
      embeds: [successEmbed("IA", `Mode de contexte : **${context}**.`)],
      ephemeral: true,
    });
    return;
  }
  await withCommand(
    async () => {
      const prompt = interaction.options.getString("prompt", true);
      const reply = await chatCompletion(interaction.user.id, interaction.guild!.id, prompt, {
        channelId: interaction.channelId,
        threadId: interaction.channel?.isThread() ? interaction.channel.id : null,
      });
      return { embeds: [buildSimpleEmbed("Mr-X IA", reply.slice(0, 4000))] };
    },
    { module: "ai", loadingTitle: "Réflexion…" },
  )(interaction, {} as import("discord.js").Client);
}
