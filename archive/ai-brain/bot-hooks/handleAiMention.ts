/**
 * Parked: reply when the bot is mentioned or replied to.
 * Lived in apps/bot/src/services/CommunityListeners.ts
 */
import type { Client, Message } from "discord.js";
import { chatCompletion } from "@sentinel/ai";
import { getGuildConfig } from "@sentinel/database";

export async function handleAiMention(message: Message, client: Client): Promise<void> {
  const cfg = await getGuildConfig(message.guild!.id);
  if (!cfg.features.ai || !cfg.ai.mentionEnabled) return;
  const me = client.user;
  if (!me) return;
  const mentioned = message.mentions.users.has(me.id);
  const repliedToBot =
    !!message.reference?.messageId &&
    (await message.fetchReference().catch(() => null))?.author?.id === me.id;
  if (!mentioned && !repliedToBot) return;
  const prompt = message.content.replace(new RegExp(`<@!?${me.id}>`, "g"), "").trim();
  if (!prompt) return;
  const threadId = message.channel.isThread() ? message.channel.id : null;
  const reply = await chatCompletion(message.author.id, message.guild!.id, prompt, {
    channelId: message.channelId,
    threadId,
  });
  const chunks = reply.match(/[\s\S]{1,1900}/g) ?? [reply.slice(0, 1900)];
  for (const chunk of chunks) {
    await message.reply({ content: chunk }).catch(() => undefined);
  }
}
