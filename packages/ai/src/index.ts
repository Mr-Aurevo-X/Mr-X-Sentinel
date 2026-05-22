import { prisma } from "@sentinel/database";

const API_KEY = process.env.OPENAI_API_KEY ?? "";
const BASE_URL = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";

export async function chatCompletion(
  userId: string,
  guildId: string | null,
  prompt: string,
): Promise<string> {
  if (!API_KEY) {
    return "IA non configurée : définis OPENAI_API_KEY dans .env.";
  }

  let conv = await prisma.aiConversation.findFirst({
    where: { userId, guildId: guildId ?? undefined },
    orderBy: { updatedAt: "desc" },
  });
  if (!conv) {
    conv = await prisma.aiConversation.create({
      data: { userId, guildId: guildId ?? undefined },
    });
  }

  const history = await prisma.aiMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages = [
    { role: "system", content: "Tu es l'assistant Mr-X Sentinel, utile et concis. Réponds en français." },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: prompt },
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 800 }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    return `Erreur API IA (${res.status}).`;
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const reply = data.choices?.[0]?.message?.content?.trim() ?? "Pas de réponse.";

  await prisma.aiMessage.createMany({
    data: [
      { conversationId: conv.id, role: "user", content: prompt },
      { conversationId: conv.id, role: "assistant", content: reply },
    ],
  });
  await prisma.aiConversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  return reply;
}

export async function resetConversation(userId: string, guildId: string | null): Promise<void> {
  await prisma.aiConversation.deleteMany({
    where: { userId, guildId: guildId ?? undefined },
  });
}
