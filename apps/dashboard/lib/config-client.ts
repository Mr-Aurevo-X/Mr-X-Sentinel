import type { GuildConfig } from "@sentinel/shared";

export async function patchGuildConfig(
  guildId: string,
  patch: Partial<GuildConfig>,
): Promise<{ ok: boolean; config?: GuildConfig; error?: string }> {
  const res = await fetch(`/api/guilds/${guildId}/config`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return { ok: false, error: "Erreur lors de la sauvegarde." };
  const data = (await res.json()) as { config: GuildConfig };
  return { ok: true, config: data.config };
}
