/**
 * Parked: slash /brain (status | analyse | toggle | seuil).
 * Lived in apps/bot/src/commands/handlers/admin.ts + extended.ts
 */
import type { ChatInputCommandInteraction } from "discord.js";
import { getGuildConfig, updateGuildConfig } from "@sentinel/database";
import { buildBrainStatusEmbed, buildSimpleEmbed, successEmbed } from "../../../apps/bot/src/ui/embeds.js";
import type { CommandReply } from "../../../apps/bot/src/commands/middleware.js";

const BRAIN_URL = process.env.BRAIN_URL ?? "http://127.0.0.1:8765";

export async function handleBrain(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  if (sub !== "status") {
    return handleBrainExtended(interaction);
  }
  try {
    const res = await fetch(`${BRAIN_URL}/status`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      return { embeds: [buildBrainStatusEmbed({ online: false })] };
    }
    const data = (await res.json()) as {
      samples?: number;
      ready?: boolean;
      spam?: number;
      toxicity?: number;
    };
    return {
      embeds: [
        buildBrainStatusEmbed({
          online: true,
          samples: data.samples,
          ready: data.ready,
          spam: data.spam,
          toxicity: data.toxicity,
        }),
      ],
    };
  } catch {
    return { embeds: [buildBrainStatusEmbed({ online: false })] };
  }
}

export async function handleBrainExtended(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const cfg = await getGuildConfig(guildId);

  if (sub === "toggle") {
    const enabled = interaction.options.getBoolean("enabled", true);
    await updateGuildConfig(guildId, { features: { ...cfg.features, brain: enabled } });
    return { embeds: [successEmbed("Brain", `Module IA **${enabled ? "ON" : "OFF"}**.`)] };
  }

  if (sub === "seuil") {
    const spam = interaction.options.getNumber("spam");
    const tox = interaction.options.getNumber("toxicity");
    const lines: string[] = [];
    if (spam != null) lines.push(`Seuil spam Brain : **${spam}** (env BRAIN_SPAM_THRESHOLD)`);
    if (tox != null) lines.push(`Seuil toxicité : **${tox}** (env BRAIN_TOX_THRESHOLD)`);
    return {
      embeds: [buildSimpleEmbed("Seuils Brain", lines.join("\n") || "Renseigne spam et/ou toxicity.")],
    };
  }

  if (sub === "analyse") {
    const text = interaction.options.getString("text", true);
    const res = await fetch(`${BRAIN_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    if (!res?.ok) throw new Error("Brain indisponible.");
    const data = (await res.json()) as { spam?: number; toxicity?: number };
    return {
      embeds: [
        buildSimpleEmbed(
          "Analyse Brain",
          `Spam : **${((data.spam ?? 0) * 100).toFixed(0)}%**\nToxicité : **${((data.toxicity ?? 0) * 100).toFixed(0)}%**`,
        ),
      ],
    };
  }

  throw new Error("Sous-commande inconnue.");
}
