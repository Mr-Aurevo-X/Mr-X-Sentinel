import type { ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import {
  economyService,
  funService,
  shopService,
  ticketService,
} from "@sentinel/core";
import { getGuildConfig, prisma, updateGuildConfig } from "@sentinel/database";
import { BRAND_COLOR, customId } from "@sentinel/shared";
import type { GuildFeatures } from "@sentinel/shared";
import { musicManager } from "../music/MusicManager.js";

const BRAIN_URL = process.env.BRAIN_URL ?? "http://127.0.0.1:8765";

export async function handleConfig(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild!.id;
  if (sub === "view") {
    const cfg = await getGuildConfig(guildId);
    const lines = Object.entries(cfg.features)
      .map(([k, v]) => `**${k}** : ${v ? "on" : "off"}`)
      .join("\n");
    await interaction.reply({ content: lines, ephemeral: true });
    return;
  }
  const mod = interaction.options.getString("module", true) as keyof GuildFeatures;
  const enabled = interaction.options.getBoolean("enabled", true);
  const cfg = await getGuildConfig(guildId);
  await updateGuildConfig(guildId, {
    features: { ...cfg.features, [mod]: enabled },
  });
  await interaction.reply({ content: `Module **${mod}** → ${enabled ? "activé" : "désactivé"}.`, ephemeral: true });
}

export async function handleAdmin(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub === "announce") {
    const channel = interaction.options.getChannel("channel", true);
    if (channel.type !== ChannelType.GuildText) throw new Error("Salon texte requis.");
    const textCh = channel as TextChannel;
    const title = interaction.options.getString("title", true);
    const message = interaction.options.getString("message", true);
    const embed = new EmbedBuilder().setColor(BRAND_COLOR).setTitle(title).setDescription(message);
    await textCh.send({ embeds: [embed] });
    await interaction.reply({ content: "Annonce publiée.", ephemeral: true });
    return;
  }
  if (sub === "shop_add") {
    const name = interaction.options.getString("name", true);
    const price = interaction.options.getInteger("price", true);
    const role = interaction.options.getRole("role");
    const item = await shopService.add(interaction.guild!.id, name, price, role?.id);
    await interaction.reply({ content: `Article ajouté : \`${item.id}\` — **${name}** (${price})`, ephemeral: true });
  }
}

export async function handleTicket(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;
  const member = interaction.member as GuildMember;

  if (sub === "open") {
    await interaction.deferReply({ ephemeral: true });
    const ch = await ticketService.openTicket(guild, member, client);
    await interaction.editReply({ content: `Ticket créé : <#${ch.id}>` });
    await ch.send({
      content: `<@${member.id}> Bienvenue ! Le staff te répondra bientôt.`,
      components: buildTicketRow(ch.id),
    });
    return;
  }

  if (sub === "setup") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      throw new Error("Permission administrateur requise.");
    }
    const panel = interaction.options.getChannel("panel", true);
    if (panel.type !== ChannelType.GuildText) throw new Error("Salon texte requis.");
    const panelCh = panel as TextChannel;
    const supportRole = interaction.options.getRole("support_role");
    const roleIds = supportRole ? [supportRole.id] : [];
    await ticketService.saveConfig(guild.id, { panelChannelId: panelCh.id, supportRoleIds: roleIds });
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("Support")
      .setDescription("Clique sur **Ouvrir un ticket** pour contacter le staff.");
    await panelCh.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(customId("ticket", "open"))
            .setLabel("Ouvrir un ticket")
            .setStyle(ButtonStyle.Primary),
        ),
      ],
    });
    await interaction.reply({ content: "Panneau tickets publié.", ephemeral: true });
    return;
  }

  if (sub === "close" || sub === "claim") {
    const mod =
      interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
    if (!mod) throw new Error("Permission modération requise.");
    if (sub === "close") {
      await interaction.deferReply({ ephemeral: true });
      await ticketService.close(interaction.channelId, client);
      await interaction.editReply({ content: "Ticket fermé." });
      return;
    }
    await ticketService.claim(interaction.channelId, interaction.user.id, client);
    await interaction.reply({ content: "Ticket claim.", ephemeral: true });
  }
}

export function buildTicketRow(channelId: string): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("ticket", "claim", channelId))
        .setLabel("Claim")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customId("ticket", "close", channelId))
        .setLabel("Fermer")
        .setStyle(ButtonStyle.Danger),
    ),
  ];
}

export async function handleFun(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
) {
  const sub = interaction.options.getSubcommand();
  const bet = interaction.options.getInteger("bet", true) ?? 0;
  const guildId = interaction.guild!.id;
  const userId = interaction.user.id;
  await interaction.deferReply({ ephemeral: true });

  const wallet = await economyService.getOrCreateWallet(guildId, userId);
  if (wallet.cash < bet) throw new Error("Pas assez de coins.");

  if (sub === "coinflip") {
    const r = funService.coinflip(bet);
    const bal = await funService.applyBet(guildId, userId, r.payout, client, "coinflip");
    await interaction.editReply({
      content: `${r.side} — ${r.win ? "gain" : "perte"} **${Math.abs(r.payout)}** | Solde: **${bal}**`,
    });
  } else if (sub === "slots") {
    const r = funService.slots(bet);
    const bal = await funService.applyBet(guildId, userId, r.payout, client, "slots");
    await interaction.editReply({
      content: `${r.symbols.join(" ")} → **${r.payout >= 0 ? "+" : ""}${r.payout}** | Solde: **${bal}**`,
    });
  } else if (sub === "roulette") {
    const color = interaction.options.getString("color", true) as "red" | "black" | "green";
    const r = funService.roulette(bet, color);
    const bal = await funService.applyBet(guildId, userId, r.payout, client, "roulette");
    await interaction.editReply({
      content: `Tirage **${r.color}** — ${r.win ? "gagné" : "perdu"} | Solde: **${bal}**`,
    });
  }
}

export async function handleBalance(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const w = await economyService.getOrCreateWallet(interaction.guild!.id, target.id);
  await interaction.reply({
    content: `<@${target.id}> — poche: **${w.cash}** | banque: **${w.bank}**`,
    ephemeral: true,
  });
}

export async function handlePay(interaction: ChatInputCommandInteraction, client: import("discord.js").Client) {
  const user = interaction.options.getUser("user", true);
  const amount = interaction.options.getInteger("amount", true);
  await economyService.transfer(interaction.guild!.id, interaction.user.id, user.id, amount);
  await economyService.logEconomy(
    client,
    interaction.guild!.id,
    "Paiement",
    `<@${interaction.user.id}> → <@${user.id}> : **${amount}**`,
    interaction.user.id,
  );
  await interaction.reply({ content: `Tu as payé **${amount}** coins à ${user.tag}.`, ephemeral: true });
}

export async function handleRob(interaction: ChatInputCommandInteraction, client: import("discord.js").Client) {
  const victim = interaction.options.getUser("user", true);
  if (victim.id === interaction.user.id) throw new Error("Tu ne peux pas te braquer toi-même.");
  await interaction.deferReply({ ephemeral: true });
  try {
    const amount = await economyService.rob(interaction.guild!.id, interaction.user.id, victim.id);
    await economyService.logEconomy(
      client,
      interaction.guild!.id,
      "Braquage",
      `<@${interaction.user.id}> a volé **${amount}** à <@${victim.id}>`,
      interaction.user.id,
    );
    await interaction.editReply({ content: `Braquage réussi ! +**${amount}** coins.` });
  } catch (e) {
    await interaction.editReply({ content: e instanceof Error ? e.message : "Échec" });
  }
}

export async function handleCrime(interaction: ChatInputCommandInteraction, client: import("discord.js").Client) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const r = await economyService.crime(interaction.guild!.id, interaction.user.id);
    await economyService.logEconomy(
      client,
      interaction.guild!.id,
      "Crime",
      `<@${interaction.user.id}> : ${r.amount} (${r.caught ? "attrapé" : "réussi"})`,
      interaction.user.id,
    );
    await interaction.editReply({
      content: r.caught
        ? `Attrapé ! **${r.amount}** coins.`
        : `Réussi ! +**${r.amount}** coins.`,
    });
  } catch (e) {
    await interaction.editReply({ content: e instanceof Error ? e.message : "Erreur" });
  }
}

export async function handleDeposit(interaction: ChatInputCommandInteraction) {
  const amount = interaction.options.getInteger("amount", true);
  await economyService.deposit(interaction.guild!.id, interaction.user.id, amount);
  await interaction.reply({ content: `**${amount}** déposés en banque.`, ephemeral: true });
}

export async function handleWithdraw(interaction: ChatInputCommandInteraction) {
  const amount = interaction.options.getInteger("amount", true);
  await economyService.withdraw(interaction.guild!.id, interaction.user.id, amount);
  await interaction.reply({ content: `**${amount}** retirés.`, ephemeral: true });
}

export async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  const rows = await economyService.leaderboard(interaction.guild!.id, 10);
  const lines = rows.map((w, i) => `${i + 1}. <@${w.userId}> — **${w.cash + w.bank}**`);
  await interaction.reply({
    content: lines.length ? lines.join("\n") : "Aucune donnée.",
    ephemeral: true,
  });
}

export async function handleShop(
  interaction: ChatInputCommandInteraction,
  client: import("discord.js").Client,
) {
  const sub = interaction.options.getSubcommand();
  if (sub === "list") {
    const items = await shopService.list(interaction.guild!.id);
    const text = items.length
      ? items.map((i) => `\`${i.id}\` **${i.name}** — ${i.price} coins`).join("\n")
      : "Boutique vide. Admin : `/admin shop_add`";
    await interaction.reply({ content: text, ephemeral: true });
    return;
  }
  const itemId = interaction.options.getString("item_id", true);
  const member = interaction.member as GuildMember;
  const item = await shopService.buy(member, itemId, client);
  await interaction.reply({ content: `Achat : **${item.name}**`, ephemeral: true });
}

export async function handleSuggest(interaction: ChatInputCommandInteraction) {
  const idea = interaction.options.getString("idea", true);
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Suggestion")
    .setDescription(idea)
    .setFooter({ text: interaction.user.tag });
  if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) {
    await interaction.channel.send({ embeds: [embed] });
  }
  await interaction.reply({ content: "Suggestion envoyée.", ephemeral: true });
}

export async function handleBrain(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const res = await fetch(`${BRAIN_URL}/health`, { signal: AbortSignal.timeout(3000) });
    const ok = res.ok;
    await interaction.editReply({
      content: ok ? "Mr-X Brain : **en ligne**" : `Brain : HTTP ${res.status}`,
    });
  } catch {
    await interaction.editReply({
      content: "Mr-X Brain : **hors ligne** (lance `docker compose up` ou le service Python).",
    });
  }
}

export async function handleClearwarn(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  await prisma.guildMemberRecord.upsert({
    where: { guildId_userId: { guildId: interaction.guild!.id, userId: user.id } },
    create: { guildId: interaction.guild!.id, userId: user.id, warnCount: 0 },
    update: { warnCount: 0 },
  });
  await interaction.reply({ content: `Warns effacés pour ${user.tag}.`, ephemeral: true });
}

export async function handleNickname(interaction: ChatInputCommandInteraction) {
  const member = interaction.options.getMember("user") as GuildMember | null;
  if (!member) throw new Error("Membre introuvable");
  const name = interaction.options.getString("name", true);
  await member.setNickname(name, `Par ${interaction.user.tag}`);
  await interaction.reply({ content: `Pseudo mis à jour.`, ephemeral: true });
}

export async function handlePlayMusic(interaction: ChatInputCommandInteraction, client: import("discord.js").Client) {
  const member = interaction.member as GuildMember;
  const voice = member.voice.channel;
  if (!voice) throw new Error("Rejoins un salon vocal d'abord.");
  const query = interaction.options.getString("query", true);
  await interaction.deferReply();
  const { embed } = await musicManager.play(client, voice, query, interaction.user.id, interaction.channelId);
  await interaction.editReply({
    embeds: [embed],
    components: musicManager.playerControls(interaction.guild!.id),
  });
}
