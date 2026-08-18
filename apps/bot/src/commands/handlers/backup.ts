import type { ChatInputCommandInteraction } from "discord.js";
import { enqueueRestore, snapshotService } from "@sentinel/core";
import { prisma } from "@sentinel/database";
import { buildSimpleEmbed, errorEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleBackup(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;

  if (sub === "create") {
    const snapId = await snapshotService.capture(guild, "manual");
    return { embeds: [successEmbed("Snapshot", `\`${snapId}\` créé.`)] };
  }

  if (sub === "list") {
    const snaps = await prisma.snapshot.findMany({
      where: { guildId: guild.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return {
      embeds: [
        buildSimpleEmbed(
          "Snapshots",
          snaps.length ? snaps.map((s) => `\`${s.id}\` — ${s.label}`).join("\n") : "Aucun snapshot.",
        ),
      ],
    };
  }

  if (sub === "restore") {
    const id = interaction.options.getString("id", true);
    const snap = await prisma.snapshot.findFirst({
      where: { id, guildId: guild.id },
    });
    if (!snap) {
      return { embeds: [errorEmbed("Snapshot", "Snapshot introuvable.")] };
    }
    await enqueueRestore(guild.id, id);
    return { embeds: [successEmbed("Restauration", `Planifiée pour \`${id}\`.`)] };
  }

  throw new Error("Sous-commande inconnue.");
}
