import type { ChatInputCommandInteraction } from "discord.js";
import { logProvisioningService, logService, templateService } from "@sentinel/core";
import { prisma } from "@sentinel/database";
import { successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleSetup(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
): Promise<CommandReply> {
  const guild = interaction.guild!;
  const createLogs = interaction.options.getBoolean("create_logs") ?? true;
  const templateKey = interaction.options.getString("template");

  if (templateKey) {
    await templateService.apply(guild, templateKey, client, interaction.user.id, { createLogs: false });
  }

  let quarantineRole = guild.roles.cache.find((r) => r.name === "Quarantine");
  if (!quarantineRole) {
    quarantineRole = await guild.roles.create({
      name: "Quarantine",
      color: 0x2f3136,
      permissions: [],
      reason: "Mr-X Sentinel setup",
    });
  }

  if (createLogs) {
    await logProvisioningService.provisionAll(guild, interaction.user.id);
  }

  await prisma.guild.update({
    where: { id: guild.id },
    data: { quarantineRoleId: quarantineRole.id, setupComplete: true },
  });

  await logService.log(client, guild.id, "admin", {
    title: "Setup terminé",
    description: `Configuré par <@${interaction.user.id}>`,
    actorId: interaction.user.id,
  });

  return {
    embeds: [
      successEmbed(
        "Setup terminé",
        (templateKey ? `Template **${templateKey}** appliqué. ` : "") +
          (createLogs ? "Salons logs créés. " : "") +
          "Lance **/fonctionnement** pour le guide.",
      ),
    ],
  };
}
