import type { ChatInputCommandInteraction } from "discord.js";
import { levelsService, ownerModifyService } from "@sentinel/core";
import { processLevelUp } from "../../services/LevelUpHandler.js";
import { levelRewardService } from "../../services/LevelRewardService.js";
import { buildSimpleEmbed, successEmbed } from "../../ui/embeds.js";
import type { CommandReply } from "../middleware.js";

export async function handleOwner(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
): Promise<CommandReply> {
  if (!ownerModifyService.isOwner(interaction.user.id)) {
    throw new Error("Réservé au propriétaire du bot.");
  }
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  const guild = interaction.guild!;
  const user = interaction.options.getUser("user", true);

  if (sub === "balance") {
    const cash = interaction.options.getInteger("cash", true);
    const bank = interaction.options.getInteger("bank") ?? 0;
    const w = await ownerModifyService.setBalance(guildId, user.id, cash, bank);
    return { embeds: [successEmbed("Balance modifiée", `<@${user.id}> : ${ownerModifyService.formatWallet(w)}`)] };
  }
  if (sub === "xp") {
    const xp = interaction.options.getInteger("xp", true);
    const levelOpt = interaction.options.getInteger("level");
    const before = await levelsService.getOrCreate(guildId, user.id);
    const row = await levelsService.setXpAndLevel(guildId, user.id, xp, levelOpt ?? undefined);
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) await levelRewardService.apply(member, row.level);
    if (row.level > before.level) {
      await processLevelUp(client, guild, user.id, {
        level: row.level,
        xp: row.xp,
        gainedXp: Math.max(0, row.xp - before.xp),
        streakMultiplier: 1,
        streakDays: row.streak,
      });
    }
    return { embeds: [successEmbed("XP modifié", `<@${user.id}> → Niv. **${row.level}** · **${row.xp}** XP`)] };
  }
  return { embeds: [buildSimpleEmbed("Owner panel", "Utilise `/owner balance` ou `/owner xp`.")] };
}
