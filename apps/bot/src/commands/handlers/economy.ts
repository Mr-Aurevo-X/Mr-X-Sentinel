import { economyService, inventoryService, shopService, levelsService } from "@sentinel/core";
import { formatMoney, SHOP_CATALOG } from "@sentinel/shared";
import type { ChatInputCommandInteraction, Client, GuildMember } from "discord.js";
import {
  buildBalanceEmbed,
  buildLeaderboardEmbed,
  buildShopCatalogEmbed,
  buildTransactionEmbed,
  formatLeaderboardEconomyLines,
  successEmbed,
} from "../../ui/embeds.js";
import { buildLeaderboardView } from "../../views/LeaderboardView.js";
import { runEconomyReward, type EconomyRewardAction } from "../../services/EconomyActions.js";
import type { CommandReply } from "../middleware.js";

async function runReward(
  interaction: ChatInputCommandInteraction,
  client: Client,
  action: EconomyRewardAction,
): Promise<CommandReply> {
  const { embed } = await runEconomyReward(action, interaction.guild!.id, interaction.user.id, client);
  return { embeds: [embed] };
}

async function runBank(
  interaction: ChatInputCommandInteraction,
  kind: "deposit" | "withdraw",
): Promise<CommandReply> {
  const amount = interaction.options.getInteger("amount", true);
  const w =
    kind === "deposit"
      ? await economyService.deposit(interaction.guild!.id, interaction.user.id, amount)
      : await economyService.withdraw(interaction.guild!.id, interaction.user.id, amount);
  return {
    embeds: [
      buildTransactionEmbed(
        kind === "deposit" ? "🏦 Dépôt" : "🏧 Retrait",
        `**${formatMoney(amount)}** ${kind === "deposit" ? "déposés en banque" : "retirés de la banque"}.`,
        w.cash,
        w.bank,
      ),
    ],
  };
}

export async function handleBalance(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const w = await economyService.getOrCreateWallet(interaction.guild!.id, target.id);
  return {
    embeds: [
      buildBalanceEmbed(target.displayName ?? target.username, target.displayAvatarURL(), w.cash, w.bank),
    ],
  };
}

export async function handleDaily(interaction: ChatInputCommandInteraction, client: Client): Promise<CommandReply> {
  return runReward(interaction, client, "daily");
}

export async function handleWeekly(interaction: ChatInputCommandInteraction, client: Client): Promise<CommandReply> {
  return runReward(interaction, client, "weekly");
}

export async function handleMonthly(interaction: ChatInputCommandInteraction, client: Client): Promise<CommandReply> {
  return runReward(interaction, client, "monthly");
}

export async function handleWork(interaction: ChatInputCommandInteraction, client: Client): Promise<CommandReply> {
  return runReward(interaction, client, "work");
}

export async function handlePay(interaction: ChatInputCommandInteraction, client: Client): Promise<CommandReply> {
  const user = interaction.options.getUser("user", true);
  const amount = interaction.options.getInteger("amount", true);
  await economyService.transfer(interaction.guild!.id, interaction.user.id, user.id, amount);
  const w = await economyService.getOrCreateWallet(interaction.guild!.id, interaction.user.id);
  await economyService.logEconomy(
    client,
    interaction.guild!.id,
    "Paiement",
    `<@${interaction.user.id}> → <@${user.id}> : ${formatMoney(amount)}`,
    interaction.user.id,
  );
  return {
    embeds: [
      buildTransactionEmbed(
        "💸 Paiement envoyé",
        `Tu as payé **${formatMoney(amount)}** à ${user.tag}.`,
        w.cash,
        w.bank,
      ),
    ],
  };
}

export async function handleRob(interaction: ChatInputCommandInteraction, client: Client): Promise<CommandReply> {
  const victim = interaction.options.getUser("user", true);
  if (victim.id === interaction.user.id) throw new Error("Tu ne peux pas te braquer toi-même.");
  const amount = await economyService.rob(interaction.guild!.id, interaction.user.id, victim.id);
  const w = await economyService.getOrCreateWallet(interaction.guild!.id, interaction.user.id);
  await economyService.logEconomy(
    client,
    interaction.guild!.id,
    "Braquage",
    `<@${interaction.user.id}> +${formatMoney(amount)}`,
    interaction.user.id,
  );
  return {
    embeds: [
      buildTransactionEmbed(
        "🔫 Braquage réussi",
        `Tu as volé **${formatMoney(amount)}** à ${victim.tag}.`,
        w.cash,
        w.bank,
      ),
    ],
  };
}

export async function handleCrime(interaction: ChatInputCommandInteraction, client: Client): Promise<CommandReply> {
  const r = await economyService.crime(interaction.guild!.id, interaction.user.id);
  await economyService.logEconomy(
    client,
    interaction.guild!.id,
    "Crime",
    `<@${interaction.user.id}> : ${formatMoney(r.amount)} (${r.caught ? "attrapé" : "réussi"})`,
    interaction.user.id,
  );
  return {
    embeds: [
      buildTransactionEmbed(
        r.caught ? "🚔 Crime — attrapé" : "🦹 Crime — réussi",
        r.caught
          ? `Amende : **${formatMoney(Math.abs(r.amount))}**`
          : `Gain : **${formatMoney(r.amount)}**`,
        r.wallet.cash,
        r.wallet.bank,
        r.caught ? 0xed4245 : 0x57f287,
      ),
    ],
  };
}

export async function handleDeposit(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  return runBank(interaction, "deposit");
}

export async function handleWithdraw(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  return runBank(interaction, "withdraw");
}

export async function handleUse(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const itemKey = interaction.options.getString("item", true);
  const entry = await inventoryService.useItem(interaction.guild!.id, interaction.user.id, itemKey);
  const w = await economyService.getOrCreateWallet(interaction.guild!.id, interaction.user.id);
  return {
    embeds: [
      successEmbed(
        "Objet utilisé",
        `${entry.emoji} **${entry.label}** — effet appliqué.\nSolde : ${formatMoney(w.cash + w.bank)}`,
      ),
    ],
  };
}

export async function handleShop(
  interaction: ChatInputCommandInteraction,
  client: Client,
): Promise<CommandReply> {
  const sub = interaction.options.getSubcommand();
  if (sub === "list") {
    const guildItems = await shopService.list(interaction.guild!.id);
    const catalog = Object.values(SHOP_CATALOG);
    const guildLines = guildItems.map((i) => `\`${i.id}\` **${i.name}** — ${formatMoney(i.price)}`).join("\n");
    const embed = buildShopCatalogEmbed(catalog);
    if (guildItems.length) {
      embed.addFields({ name: "Boutique serveur (rôles)", value: guildLines });
    }
    return { embeds: [embed] };
  }
  if (sub === "catalog") {
    const itemKey = interaction.options.getString("item", true);
    const entry = await inventoryService.buyCatalog(interaction.guild!.id, interaction.user.id, itemKey);
    const w = await economyService.getOrCreateWallet(interaction.guild!.id, interaction.user.id);
    return {
      embeds: [
        buildTransactionEmbed(
          "🛒 Achat",
          `${entry.emoji} **${entry.label}** ajouté à ton inventaire.`,
          w.cash,
          w.bank,
        ),
      ],
    };
  }
  if (sub === "buy") {
    const itemId = interaction.options.getString("item_id", true);
    const member = interaction.member as GuildMember;
    const item = await shopService.buy(member, itemId, client);
    return { embeds: [successEmbed("Achat boutique", `**${item.name}** acheté pour ${formatMoney(item.price)}.`)] };
  }
  throw new Error("Sous-commande inconnue.");
}

export async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<CommandReply> {
  const guild = interaction.guild!;
  const ecoRows = await economyService.leaderboard(guild.id, 50);
  const levelRows = await levelsService.leaderboard(guild.id, 50);
  const globalRows = await levelsService.globalLeaderboard(guild.id, 50);
  const maxPages = Math.max(1, Math.ceil(ecoRows.length / 10));
  return {
    embeds: [
      buildLeaderboardEmbed(
        "economy",
        guild.name,
        guild.iconURL(),
        formatLeaderboardEconomyLines(
          ecoRows.slice(0, 10).map((w) => ({ userId: w.userId, total: w.total })),
          0,
        ),
        1,
        maxPages,
      ),
    ],
    components: buildLeaderboardView("economy", 1, maxPages, ecoRows, levelRows, globalRows),
  };
}
