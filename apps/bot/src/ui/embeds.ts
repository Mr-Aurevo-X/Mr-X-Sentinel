import { EmbedBuilder, type ColorResolvable, type User } from "discord.js";
import {
  BRAND_NAME,
  COLORS,
  EMOJI,
  FOOTER_TEXT,
  formatDuration,
  formatMoney,
  formatNumber,
  medalForPlace,
  progressBar,
  rankFlair,
  wealthStatus,
  type ShopCatalogEntry,
  type GuildFeatures,
  visibleGuildFeatures,
  helpPublicDescription,
} from "@sentinel/shared";

type EmbedOpts = {
  title: string;
  description?: string;
  color?: ColorResolvable;
  thumbnail?: string | null;
  image?: string | null;
  footer?: string;
};

export function baseEmbed(opts: EmbedOpts): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(opts.color ?? COLORS.brand)
    .setTitle(opts.title)
    .setTimestamp();
  if (opts.description) embed.setDescription(opts.description);
  if (opts.thumbnail) embed.setThumbnail(opts.thumbnail);
  if (opts.image) embed.setImage(opts.image);
  embed.setFooter({ text: opts.footer ?? FOOTER_TEXT });
  return embed;
}

export function successEmbed(title: string, description?: string): EmbedBuilder {
  return baseEmbed({ title: `${EMOJI.success} ${title}`, description, color: COLORS.success });
}

export function errorEmbed(title: string, description?: string): EmbedBuilder {
  return baseEmbed({ title: `${EMOJI.error} ${title}`, description, color: COLORS.error });
}

export function warningEmbed(title: string, description?: string): EmbedBuilder {
  return baseEmbed({ title: `${EMOJI.warning} ${title}`, description, color: COLORS.warning });
}

export function loadingEmbed(title = "Calcul en cours…"): EmbedBuilder {
  return baseEmbed({ title: `${EMOJI.loading} ${title}`, color: COLORS.neutral });
}

export function buildBalanceEmbed(
  displayName: string,
  avatarUrl: string | null,
  cash: number,
  bank: number,
): EmbedBuilder {
  const total = cash + bank;
  const embed = baseEmbed({
    title: `${EMOJI.money} Solde • ${displayName}`,
    color: COLORS.economy,
    thumbnail: avatarUrl,
  });
  embed.addFields(
    { name: `${EMOJI.wallet} Portefeuille`, value: formatMoney(cash), inline: true },
    { name: `${EMOJI.bank} Banque`, value: formatMoney(bank), inline: true },
    { name: `${EMOJI.total} Total`, value: formatMoney(total), inline: true },
    { name: "Statut", value: wealthStatus(total), inline: false },
  );
  return embed;
}

export function buildTransactionEmbed(
  title: string,
  description: string,
  cash: number,
  bank: number,
  color: ColorResolvable = COLORS.success,
): EmbedBuilder {
  const embed = baseEmbed({ title, description, color });
  embed.addFields(
    { name: "Portefeuille", value: formatMoney(cash), inline: true },
    { name: "Banque", value: formatMoney(bank), inline: true },
    { name: "Total", value: formatMoney(cash + bank), inline: true },
  );
  return embed;
}

export function buildRewardEmbed(
  title: string,
  reward: number,
  cash: number,
  bank: number,
): EmbedBuilder {
  return buildTransactionEmbed(
    title,
    `Tu as reçu **${formatMoney(reward)}** !`,
    cash,
    bank,
    COLORS.success,
  );
}

export function buildCooldownEmbed(remainingSec: number, action: string): EmbedBuilder {
  return warningEmbed(
    "Cooldown actif",
    `Tu pourras **${action}** dans **${formatDuration(remainingSec)}**.`,
  );
}

export function buildRankEmbed(
  displayName: string,
  avatarUrl: string | null,
  level: number,
  xp: number,
  xpForNext: number,
  xpInLevel: number,
): EmbedBuilder {
  const needed = Math.max(1, xpForNext - xpInLevel);
  const progress = Math.max(0, xp - xpInLevel);
  const pct = Math.min(100, Math.floor((progress / needed) * 100));
  const embed = baseEmbed({
    title: `${EMOJI.rank} Rank • ${displayName}`,
    description: `${rankFlair(level)}\n\n${progressBar(progress, needed)}\n**${formatNumber(progress)} / ${formatNumber(needed)} XP** • ${pct}%`,
    color: COLORS.levels,
    thumbnail: avatarUrl,
  });
  embed.addFields(
    { name: "Niveau", value: `**${formatNumber(level)}**`, inline: true },
    { name: "XP totale", value: `**${formatNumber(xp)}**`, inline: true },
    { name: "XP restante", value: `**${formatNumber(Math.max(0, needed - progress))}**`, inline: true },
  );
  return embed;
}

export function buildLeaderboardEmbed(
  tab: "economy" | "levels" | "global",
  _guildName: string,
  guildIcon: string | null,
  lines: string[],
  page: number,
  maxPages: number,
): EmbedBuilder {
  const tabLabel = tab === "economy" ? "Économie" : tab === "levels" ? "Niveaux" : "Global";
  const embed = baseEmbed({
    title: `${EMOJI.trophy} Classement • ${tabLabel}`,
    description: lines.length ? lines.join("\n") : "Aucune donnée pour l'instant.",
    color: tab === "economy" ? COLORS.economy : tab === "levels" ? COLORS.levels : COLORS.brand,
    thumbnail: guildIcon,
  });
  embed.setFooter({ text: `${FOOTER_TEXT} • Page ${page}/${maxPages}` });
  return embed;
}

export function formatLeaderboardEconomyLines(
  rows: { userId: string; total: number }[],
  startIndex: number,
): string[] {
  return rows.map((r, i) => `${medalForPlace(startIndex + i)} <@${r.userId}> — **${formatMoney(r.total)}**`);
}

export function formatLeaderboardLevelLines(
  rows: { userId: string; level: number; xp: number }[],
  startIndex: number,
): string[] {
  return rows.map(
    (r, i) =>
      `${medalForPlace(startIndex + i)} <@${r.userId}> — Niv. **${formatNumber(r.level)}** • **${formatNumber(r.xp)}** XP`,
  );
}

export function formatLeaderboardGlobalLines(
  rows: { userId: string; score: number; level: number }[],
  startIndex: number,
): string[] {
  return rows.map(
    (r, i) =>
      `${medalForPlace(startIndex + i)} <@${r.userId}> — Score **${formatNumber(r.score)}** (Niv. ${formatNumber(r.level)})`,
  );
}

export function buildSentinelMasterHubEmbed(
  guildName: string,
  memberCount: number,
  featuresOn: number,
  featureTotal: number,
  bannerUrl?: string | null,
): EmbedBuilder {
  return baseEmbed({
    title: `${BRAND_NAME} — Hub`,
    description: `Bienvenue sur **${guildName}**.\n\n**${memberCount}** membres • **${featuresOn}/${featureTotal}** modules actifs\n\nUtilise les boutons pour naviguer.`,
    color: COLORS.brand,
    image: bannerUrl ?? undefined,
  });
}

export function buildEcoHubHomeEmbed(
  _displayName: string,
  avatarUrl: string | null,
  cash: number,
  bank: number,
  itemCount: number,
): EmbedBuilder {
  const total = cash + bank;
  const embed = baseEmbed({
    title: "Économie",
    description: "Utilise les boutons pour naviguer entre ton profil, la banque, la boutique et les infos.",
    color: COLORS.economy,
    thumbnail: avatarUrl,
  });
  embed.addFields(
    { name: "Portefeuille", value: formatMoney(cash), inline: true },
    { name: "Banque", value: formatMoney(bank), inline: true },
    { name: "Total", value: formatMoney(total), inline: true },
    { name: "Inventaire", value: `${itemCount} objet(s)`, inline: false },
    { name: "Statut", value: wealthStatus(total), inline: false },
  );
  return embed;
}

export function buildEcoBankEmbed(cash: number, bank: number): EmbedBuilder {
  return baseEmbed({
    title: `${EMOJI.bank} Banque`,
    description: "Dépose ou retire via `/deposit` et `/withdraw`.",
    color: COLORS.economy,
  }).addFields(
    { name: "Argent liquide", value: formatMoney(cash), inline: true },
    { name: "Banque", value: formatMoney(bank), inline: true },
    { name: "Total", value: formatMoney(cash + bank), inline: true },
  );
}

export function buildInventoryEmbed(items: { key: string; entry: ShopCatalogEntry; qty: number }[]): EmbedBuilder {
  const lines =
    items.length === 0
      ? "Inventaire vide — achète des objets avec `/shop catalog`."
      : items.map((i) => `${i.entry.emoji} **${i.entry.label}** ×${i.qty}`).join("\n");
  return baseEmbed({
    title: "🎒 Inventaire",
    description: lines,
    color: COLORS.economy,
  });
}

export function buildShopCatalogEmbed(items: ShopCatalogEntry[]): EmbedBuilder {
  const lines = items.map((i) => `${i.emoji} **${i.label}** — ${formatMoney(i.price)}\n*${i.description}*`);
  return baseEmbed({
    title: `${EMOJI.shop} Boutique`,
    description: lines.join("\n\n") || "Catalogue vide.",
    color: COLORS.economy,
  });
}

export function buildEcoInfoEmbed(): EmbedBuilder {
  return baseEmbed({
    title: "ℹ️ Infos économie",
    description:
      "**Commandes :** `/daily` `/weekly` `/monthly` `/work` `/pay` `/rob` `/crime`\n**Banque :** `/deposit` `/withdraw`\n**Shop :** `/shop list` `/shop catalog` `/use`",
    color: COLORS.info,
  });
}

export function buildGambleHubEmbed(): EmbedBuilder {
  return baseEmbed({
    title: `${EMOJI.gamble} Casino`,
    description: "Choisis un jeu ci-dessous. Mise par défaut : **50 $** (blackjack : modal).",
    color: COLORS.fun,
  });
}

export function buildMinijeuxHubEmbed(): EmbedBuilder {
  return baseEmbed({
    title: "🎮 Mini-jeux",
    description: "Jeux rapides sans mise ou avec mise légère. Utilise les boutons ci-dessous.",
    color: COLORS.fun,
  });
}

export function buildPanelEmbed(): EmbedBuilder {
  return baseEmbed({
    title: "Panel staff",
    description:
      "**Modération :** boutons ci-dessous ou `/ban` `/kick` `/mute` `/warn` `/clear` `/nuke`\n**Sécurité :** `/security`\n**Logs :** `/logs create`",
    color: COLORS.brand,
  });
}

export function buildBlackjackEmbed(
  playerCards: number[],
  playerTotal: number,
  dealerVisible: number,
  bet: number,
  status?: string,
): EmbedBuilder {
  const desc = [
    `**Mise :** ${formatMoney(bet)}`,
    `**Tes cartes :** ${playerCards.join(" + ")} = **${playerTotal}**`,
    `**Croupier :** ${dealerVisible} + ?`,
    status ?? "",
  ]
    .filter(Boolean)
    .join("\n");
  return baseEmbed({ title: "🃏 Blackjack", description: desc, color: COLORS.fun });
}

export function buildFunResultEmbed(
  game: string,
  resultText: string,
  payout: number,
  balance: number,
  win: boolean,
): EmbedBuilder {
  return baseEmbed({
    title: `${EMOJI.gamble} ${game}`,
    description: `${resultText}\n\n${win ? "Gain" : "Perte"} : **${formatMoney(Math.abs(payout))}**\nSolde : **${formatMoney(balance)}**`,
    color: win ? COLORS.success : COLORS.error,
  });
}

export function buildSlotsSpinEmbed(symbols: string[]): EmbedBuilder {
  return baseEmbed({
    title: `${EMOJI.gamble} Machine à sous`,
    description: `🎰 │ ${symbols.join(" │ ")} │`,
    color: COLORS.fun,
  });
}

export function buildTicketPanelEmbed(): EmbedBuilder {
  return baseEmbed({
    title: `${EMOJI.ticket} Support`,
    description: "Clique sur **Ouvrir un ticket** pour contacter le staff.",
    color: COLORS.brand,
  });
}

export function buildTicketOpenEmbed(user: User): EmbedBuilder {
  return baseEmbed({
    title: `${EMOJI.ticket} Ticket ouvert`,
    description: `<@${user.id}> Bienvenue ! Le staff te répondra bientôt.`,
    color: COLORS.success,
    thumbnail: user.displayAvatarURL(),
  });
}

export function buildModuleDisabledEmbed(module: string): EmbedBuilder {
  return warningEmbed("Module désactivé", `Le module **${module}** est désactivé. Utilise \`/config feature\`.`);
}

export function buildConfigViewEmbed(features: GuildFeatures): EmbedBuilder {
  const lines = visibleGuildFeatures(features)
    .map(([k, v]) => `**${k}** : ${v ? "✅ on" : "❌ off"}`)
    .join("\n");
  return baseEmbed({ title: "Configuration serveur", description: lines, color: COLORS.brand });
}

export function buildHelpEmbed(
  tier: "public" | "staff" | "owner" | "bot_owner" = "public",
  features: GuildFeatures,
): EmbedBuilder {
  const blocks: Record<typeof tier, string> = {
    public: helpPublicDescription(features),
    staff:
      "**Modération :** `/ban` `/kick` `/mute` `/warn` `/clear` `/panel`\n**Admin :** `/admin panel` `/admin roles` `/admin announce` `/admin shop_add`\n**Salons :** `/channel slowmode|lock|unlock`\n**Tickets :** `/ticket setup|close|claim|rename`\n**Automod :** `/automod panel`\n**Logs :** `/logs create`\n**Commandes perso :** `/addcommand` `/removecommand`",
    owner:
      "**Dashboard :** `/dashboard`\n**Config :** `/config view|feature|economy`\n**Niveaux :** `/levels channel` `/levels roles`\n**Templates :** `/template panel`\n**Sécurité :** `/security whitelist_add` puis `/security arm`",
    bot_owner: "**Global :** `/owner` · `/security whitelist_*` · `/backup` · `/sentinel`",
  };
  return baseEmbed({
    title: `Aide — ${tier === "bot_owner" ? "Bot owner" : tier.charAt(0).toUpperCase() + tier.slice(1)}`,
    description: blocks[tier],
    color: COLORS.brand,
  });
}

export function buildLevelUpEmbed(
  displayName: string,
  level: number,
  avatarUrl: string | null,
  xpInLevel?: number,
  xpNeeded?: number,
  extras?: { gainedXp?: number; streakMultiplier?: number; unlockedRoleName?: string },
): EmbedBuilder {
  const bar =
    xpInLevel !== undefined && xpNeeded !== undefined && xpNeeded > 0
      ? `\n${progressBar(xpInLevel, xpNeeded)}`
      : "";
  const lines = [
    `**${displayName}** a atteint le niveau **${formatNumber(level)}** !`,
    rankFlair(level),
  ];
  if (extras?.gainedXp) lines.push(`**+${formatNumber(extras.gainedXp)} XP**`);
  if (extras?.streakMultiplier && extras.streakMultiplier > 1) {
    lines.push(`Streak : **×${extras.streakMultiplier.toFixed(1)}**`);
  }
  if (extras?.unlockedRoleName) lines.push(`Rôle débloqué : **${extras.unlockedRoleName}**`);
  return baseEmbed({
    title: "🎉 Level up !",
    description: `${lines.join("\n")}${bar}`,
    color: COLORS.levels,
    thumbnail: avatarUrl,
  });
}

export function buildWelcomeEmbed(
  _displayName: string,
  message: string,
  avatarUrl: string,
  memberCount: number,
): EmbedBuilder {
  return baseEmbed({
    title: "👋 Bienvenue",
    description: message,
    color: COLORS.success,
    thumbnail: avatarUrl,
    footer: `${FOOTER_TEXT} · Membre #${memberCount}`,
  });
}

export function buildGoodbyeEmbed(message: string): EmbedBuilder {
  return baseEmbed({
    title: "👋 Départ",
    description: message,
    color: COLORS.error,
  });
}

export function buildSimpleEmbed(title: string, description: string, color: ColorResolvable = COLORS.brand): EmbedBuilder {
  return baseEmbed({ title, description, color });
}
