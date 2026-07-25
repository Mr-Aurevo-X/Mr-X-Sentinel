import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type Client,
  type GuildMember,
  type StringSelectMenuInteraction,
  type UserSelectMenuInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import {
  economyService,
  funService,
  levelsService,
  logProvisioningService,
  sectionContent,
  templateService,
  listTemplates,
  ticketService,
  type FonctionnementSection,
  type ModerationService,
} from "@sentinel/core";
import { customId, parseCustomId, LOG_TYPES, formatMoney } from "@sentinel/shared";
import { getGuildConfig, updateGuildConfig, prisma } from "@sentinel/database";
import { buildTicketRow, buildTicketReasonModal } from "./commands/handlers/tickets.js";
import { buildHelpTierRows } from "./views/HelpView.js";
import { musicManager } from "./music/MusicManager.js";
import { withComponent } from "./commands/middleware.js";
import { assertComponentAccess, assertTier } from "./commands/permissions.js";
import {
  buildFunResultEmbed,
  buildBlackjackEmbed,
  buildGambleHubEmbed,
  buildHelpEmbed,
  buildLeaderboardEmbed,
  buildRankEmbed,
  buildSimpleEmbed,
  buildSlotsSpinEmbed,
  buildTicketOpenEmbed,
  errorEmbed,
  formatLeaderboardEconomyLines,
  formatLeaderboardGlobalLines,
  formatLeaderboardLevelLines,
  successEmbed,
  warningEmbed,
} from "./ui/embeds.js";
import {
  buildTemplateApplySelect,
  buildTemplatePanelRows,
  buildTemplateResetConfirmRows,
} from "./views/TemplatePanelView.js";
import {
  buildGambleHubRows,
  buildSentinelMasterHubRows,
} from "./views/HubViews.js";
import { buildLeaderboardView, type LeaderboardTab } from "./views/LeaderboardView.js";
import { buildBlackjackRows } from "./views/BlackjackView.js";
import { provisionWelcomeChannels, buildWelcomeSetupRows } from "./views/WelcomeSetupView.js";
import { renderEcoTab, runEconomyReward, type EcoTab } from "./services/EconomyActions.js";
import {
  deleteBlackjackSession,
  doubleSession,
  getBlackjackSession,
  hitSession,
  sessionDealerTotal,
  sessionPlayerTotal,
  standSession,
  startBlackjackSession,
  blackjackSettlement,
} from "./services/BlackjackSession.js";
import { buildFonctionnementView } from "./commands/fonctionnement.js";
import { buildModerationConfirmRows, buildModPanelUserSelect } from "./views/ModerationViews.js";
import { buildAutomodPanelRows } from "./views/AutomodPanelView.js";

const PER_PAGE = 10;
const MINIJEU_BET = 50;

const HELP_TIER_ACCESS: Record<string, import("./commands/permissions.js").AccessTier> = {
  public: "public",
  staff: "mod",
  owner: "guild_owner",
  bot_owner: "bot_owner",
};

export async function handleModal(
  interaction: ModalSubmitInteraction,
  client: Client,
): Promise<void> {
  if (!interaction.guild) return;
  const parsed = parseCustomId(interaction.customId);
  if (!parsed || parsed.module !== "ticket" || parsed.action !== "modal") return;

  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild;
  const member = interaction.member as GuildMember;
  const type = parsed.extra ?? "support";
  const reason = interaction.fields.getTextInputValue("reason");
  const ch = await ticketService.openTicket(guild, member, client, type);
  await ch.send({
    embeds: [buildTicketOpenEmbed(member.user), buildSimpleEmbed("Raison", reason)],
    components: buildTicketRow(ch.id),
  });
  await interaction.editReply({ embeds: [successEmbed("Ticket créé", `<#${ch.id}>`)] });
}

export async function handleComponent(
  interaction: ButtonInteraction | StringSelectMenuInteraction | UserSelectMenuInteraction,
  client: Client,
  moderation: ModerationService,
): Promise<void> {
  if (!interaction.guild) return;

  await withComponent(interaction, async () => {
    const guild = interaction.guild!;
    if (interaction.isStringSelectMenu() && interaction.customId === "sentinel:fonctionnement:section") {
      assertComponentAccess(interaction, "fonctionnement", "section");
      const section = interaction.values[0] as FonctionnementSection;
      const features = (await getGuildConfig(guild.id)).features;
      const { title, body } = sectionContent(section, features);
      await interaction.update({
        embeds: [buildSimpleEmbed(`Mr-X Sentinel — ${title}`, body)],
        components: buildFonctionnementView(features, section),
      });
      return;
    }

    const parsed = parseCustomId(interaction.customId);
    if (!parsed) return;

    if (parsed.module === "help" && parsed.action === "tier" && interaction.isStringSelectMenu()) {
      const tier = interaction.values[0] ?? "public";
      const need = HELP_TIER_ACCESS[tier] ?? "public";
      if (!guild) return;
      assertTier(
        { guild, user: interaction.user } as Parameters<typeof assertTier>[0],
        interaction.member as GuildMember,
        need,
      );
      await interaction.update({
        embeds: [buildHelpEmbed(tier as "public" | "staff" | "owner" | "bot_owner")],
        components: buildHelpTierRows(),
      });
      return;
    }

    assertComponentAccess(interaction, parsed.module, parsed.action);

    if (parsed.module === "eco") {
      await interaction.deferUpdate();
      const member = interaction.member as GuildMember;
      const tab = (parsed.action as EcoTab) || "home";
      const payload = await renderEcoTab(tab, member, guild.id);
      await interaction.editReply(payload);
      return;
    }

    if (parsed.module === "lb") {
      await interaction.deferUpdate();
      const ecoRows = await economyService.leaderboard(guild.id, 50);
      const levelRows = await levelsService.leaderboard(guild.id, 50);
      const globalRows = await levelsService.globalLeaderboard(guild.id, 50);
      let tab: LeaderboardTab = "economy";
      let page = 1;

      if (parsed.action === "economy" || parsed.action === "levels" || parsed.action === "global") {
        tab = parsed.action;
        page = parseInt(parsed.extra ?? "1", 10) || 1;
      } else if (parsed.action === "prev" || parsed.action === "next") {
        const [t, p] = (parsed.extra ?? "economy:1").split(":");
        tab = (t as LeaderboardTab) || "economy";
        page = parseInt(p ?? "1", 10) || 1;
        if (parsed.action === "prev") page = Math.max(1, page - 1);
        else page += 1;
      }

      const rows = tab === "economy" ? ecoRows : tab === "levels" ? levelRows : globalRows;
      const maxPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
      page = Math.min(page, maxPages);
      const start = (page - 1) * PER_PAGE;

      const lines =
        tab === "economy"
          ? formatLeaderboardEconomyLines(
              ecoRows.slice(start, start + PER_PAGE).map((r) => ({ userId: r.userId, total: r.total })),
              start,
            )
          : tab === "levels"
            ? formatLeaderboardLevelLines(
                levelRows.slice(start, start + PER_PAGE).map((r) => ({ userId: r.userId, level: r.level, xp: r.xp })),
                start,
              )
            : formatLeaderboardGlobalLines(
                globalRows.slice(start, start + PER_PAGE).map((r) => ({
                  userId: r.userId,
                  score: r.score,
                  level: r.level,
                })),
                start,
              );

      await interaction.editReply({
        embeds: [buildLeaderboardEmbed(tab, guild.name, guild.iconURL(), lines, page, maxPages)],
        components: buildLeaderboardView(tab, page, maxPages, ecoRows, levelRows, globalRows),
      });
      return;
    }

    if (parsed.module === "sentinel") {
      if (parsed.action === "eco") {
        await interaction.deferUpdate();
        const member = interaction.member as GuildMember;
        const payload = await renderEcoTab("home", member, guild.id);
        await interaction.editReply(payload);
        return;
      }
      if (parsed.action === "gamble") {
        await interaction.deferUpdate();
        await interaction.editReply({ embeds: [buildGambleHubEmbed()], components: buildGambleHubRows() });
        return;
      }
      if (parsed.action === "help") {
        await interaction.deferUpdate();
        await interaction.editReply({ embeds: [buildHelpEmbed()], components: buildSentinelMasterHubRows() });
        return;
      }
      if (parsed.action === "rank") {
        await interaction.deferReply({ ephemeral: true });
        const row = await levelsService.getOrCreate(guild.id, interaction.user.id);
        const member = interaction.member as GuildMember;
        const { currentLevelXp, nextLevelXp } = levelsService.getProgress(row.xp, row.level);
        await interaction.editReply({
          embeds: [
            buildRankEmbed(member.displayName, member.displayAvatarURL(), row.level, row.xp, nextLevelXp, currentLevelXp),
          ],
        });
        return;
      }
    }

    if (parsed.module === "economy") {
      if (parsed.action === "daily" || parsed.action === "work") {
        await interaction.deferReply({ ephemeral: true });
        const { embed } = await runEconomyReward(parsed.action, guild.id, interaction.user.id, client);
        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    async function runHubBetGame(bet: number, run: () => { payout: number; text: string; win: boolean }) {
      await interaction.deferReply({ ephemeral: true });
      const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
      if (wallet.cash < bet) {
        await interaction.editReply({ embeds: [errorEmbed("Fonds insuffisants", `Minimum ${formatMoney(bet)}.`)] });
        return;
      }
      const r = run();
      const bal = await funService.applyBet(guild.id, interaction.user.id, r.payout, client, "casino");
      await interaction.editReply({ embeds: [buildFunResultEmbed("Casino", r.text, r.payout, bal, r.win)] });
    }

    if (parsed.module === "fun") {
      const bet = 50;
      if (parsed.action === "coinflip") {
        await runHubBetGame(bet, () => {
          const r = funService.coinflip(bet);
          return { payout: r.payout, text: `Résultat : **${r.side}**`, win: r.win };
        });
        return;
      }
      if (parsed.action === "roulette") {
        await runHubBetGame(bet, () => {
          const r = funService.roulette(bet, Math.random() < 0.5 ? "red" : "black");
          return { payout: r.payout, text: `Tirage **${r.color}**`, win: r.win };
        });
        return;
      }
      if (parsed.action === "blackjack") {
        await interaction.deferReply({ ephemeral: true });
        const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
        if (wallet.cash < bet) {
          await interaction.editReply({ embeds: [errorEmbed("Fonds insuffisants", `Minimum ${formatMoney(bet)}.`)] });
          return;
        }
        await economyService.getOrCreateWallet(guild.id, interaction.user.id);
        const session = await startBlackjackSession(guild.id, interaction.user.id, bet);
        await interaction.editReply({
          embeds: [buildBlackjackEmbed(session.player, sessionPlayerTotal(session), session.dealer[0]!, bet)],
          components: buildBlackjackRows(session.id),
        });
        return;
      }
      if (parsed.action === "slots") {
        await interaction.deferReply({ ephemeral: true });
        const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
        if (wallet.cash < bet) {
          await interaction.editReply({ embeds: [errorEmbed("Fonds insuffisants", `Minimum ${formatMoney(bet)}.`)] });
          return;
        }
        await interaction.editReply({ embeds: [buildSlotsSpinEmbed(["?", "?", "?"])] });
        await new Promise((r) => setTimeout(r, 600));
        const r = funService.slots(bet);
        const bal = await funService.applyBet(guild.id, interaction.user.id, r.payout, client, "slots");
        await interaction.editReply({
          embeds: [buildFunResultEmbed("Slots", r.symbols.join(" │ "), r.payout, bal, r.payout > 0)],
        });
        return;
      }
    }

    if (parsed.module === "minijeu") {
      await interaction.deferReply({ ephemeral: true });
      const wallet = await economyService.getOrCreateWallet(guild.id, interaction.user.id);
      if (wallet.cash < MINIJEU_BET) {
        await interaction.editReply({
          embeds: [errorEmbed("Fonds insuffisants", `Mise : **${formatMoney(MINIJEU_BET)}**`)],
        });
        return;
      }
      if (parsed.action === "rps") {
        const choices = ["pierre", "feuille", "ciseaux"];
        const bot = choices[Math.floor(Math.random() * 3)]!;
        const player = choices[Math.floor(Math.random() * 3)]!;
        const win =
          (player === "pierre" && bot === "ciseaux") ||
          (player === "feuille" && bot === "pierre") ||
          (player === "ciseaux" && bot === "feuille");
        const payout = win ? MINIJEU_BET : -MINIJEU_BET;
        const bal = await funService.applyBet(guild.id, interaction.user.id, payout, client, "rps");
        await interaction.editReply({
          embeds: [
            buildFunResultEmbed(
              "RPS",
              `Toi : **${player}** · Bot : **${bot}**`,
              payout,
              bal,
              win,
            ),
          ],
        });
        return;
      }
      if (parsed.action === "dice") {
        const roll = Math.floor(Math.random() * 6) + 1;
        const win = roll >= 4;
        const payout = win ? MINIJEU_BET : -MINIJEU_BET;
        const bal = await funService.applyBet(guild.id, interaction.user.id, payout, client, "dice");
        await interaction.editReply({
          embeds: [buildFunResultEmbed("🎲 Dé", `Résultat : **${roll}**`, payout, bal, win)],
        });
        return;
      }
      if (parsed.action === "guess") {
        const n = Math.floor(Math.random() * 10) + 1;
        const win = n >= 7;
        const payout = win ? MINIJEU_BET * 2 : -MINIJEU_BET;
        const bal = await funService.applyBet(guild.id, interaction.user.id, payout, client, "guess");
        await interaction.editReply({
          embeds: [
            buildFunResultEmbed("🔢 Devine", `Le nombre était **${n}**`, payout, bal, win),
          ],
        });
        return;
      }
    }

    if (parsed.module === "bj" && parsed.extra) {
      await interaction.deferUpdate();
      const session = await getBlackjackSession(parsed.extra);
      if (!session || session.userId !== interaction.user.id) {
        await interaction.editReply({ embeds: [errorEmbed("Session expirée")], components: [] });
        return;
      }
      if (parsed.action === "hit") {
        const s = await hitSession(session);
        if (s.finished) {
          const bal = await funService.applyBet(guild.id, s.userId, 0, client, "blackjack");
          await deleteBlackjackSession(s.id);
          await interaction.editReply({
            embeds: [buildFunResultEmbed("Blackjack", "Bust !", -s.bet, bal, false)],
            components: [],
          });
          return;
        }
        await interaction.editReply({
          embeds: [buildBlackjackEmbed(s.player, sessionPlayerTotal(s), s.dealer[0]!, s.bet)],
          components: buildBlackjackRows(s.id),
        });
        return;
      }
      if (parsed.action === "double") {
        const s = await doubleSession(session);
        const { session: fin, payout, win, push } = await standSession(s);
        const settlement = blackjackSettlement(s.bet, win && !push, push);
        const bal = await funService.applyBet(guild.id, s.userId, settlement, client, "blackjack");
        await deleteBlackjackSession(s.id);
        await interaction.editReply({
          embeds: [
            buildFunResultEmbed(
              "Blackjack",
              `Double ! Croupier **${sessionDealerTotal(fin)}**`,
              payout,
              bal,
              win && !push,
            ),
          ],
          components: [],
        });
        return;
      }
      if (parsed.action === "stand") {
        const { session: s, payout, win, push } = await standSession(session);
        const settlement = blackjackSettlement(s.bet, win && !push, push);
        const bal = await funService.applyBet(guild.id, s.userId, settlement, client, "blackjack");
        await deleteBlackjackSession(s.id);
        await interaction.editReply({
          embeds: [
            buildFunResultEmbed(
              "Blackjack",
              `Croupier **${sessionDealerTotal(s)}**${push ? " — égalité" : ""}`,
              payout,
              bal,
              win && !push,
            ),
          ],
          components: [],
        });
      }
      return;
    }

    if (parsed.module === "mod") {
      if (parsed.action === "cancel") {
        await interaction.update({ embeds: [buildSimpleEmbed("Annulé", "Action annulée.")], components: [] });
        return;
      }
      if (parsed.action === "confirm" && parsed.extra) {
        const colon = parsed.extra.indexOf(":");
        if (colon === -1) return;
        const modAction = parsed.extra.slice(0, colon);
        const targetId = parsed.extra.slice(colon + 1);
        const reason = "Via panel modération Mr-X Sentinel";
        await interaction.deferUpdate();

        if (modAction === "nuke") {
          const channel = guild.channels.cache.get(targetId);
          if (!channel?.isTextBased() || channel.isDMBased() || !("clone" in channel)) {
            throw new Error("Salon introuvable ou non clonable.");
          }
          const textChannel = channel as import("discord.js").TextChannel;
          const position = textChannel.position;
          const clone = await textChannel.clone({ reason: "Mr-X Sentinel nuke" });
          await clone.setPosition(position);
          await channel.delete("Nuke");
          await clone.send({ embeds: [successEmbed("Nuke", "Salon recréé par Mr-X Sentinel.")] });
          return;
        }

        if (modAction === "clear") {
          const channel = guild.channels.cache.get(targetId);
          if (!channel?.isTextBased() || channel.isDMBased()) throw new Error("Salon invalide.");
          const deleted = await channel.bulkDelete(10, true);
          await interaction.editReply({
            embeds: [successEmbed("Clear", `${deleted.size} messages supprimés.`)],
            components: [],
          });
          return;
        }

        const targetMember = await guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) throw new Error("Membre introuvable.");

        if (modAction === "warn") {
          await moderation.warn(targetMember, interaction.user, reason);
          await interaction.editReply({
            embeds: [successEmbed("Warn", `<@${targetId}> averti.`)],
            components: [],
          });
          return;
        }
        if (modAction === "mute") {
          await moderation.mute(targetMember, interaction.user, reason, 10 * 60 * 1000);
          await interaction.editReply({
            embeds: [successEmbed("Mute", `<@${targetId}> mute 10 min.`)],
            components: [],
          });
          return;
        }
        if (modAction === "kick") {
          await moderation.kick(targetMember, interaction.user, reason);
          await interaction.editReply({
            embeds: [successEmbed("Kick", `<@${targetId}> expulsé.`)],
            components: [],
          });
          return;
        }
        if (modAction === "ban") {
          await moderation.ban(guild.id, targetId, interaction.user, reason);
          await interaction.editReply({
            embeds: [successEmbed("Ban", `<@${targetId}> banni.`)],
            components: [],
          });
        }
      }
      return;
    }

    if (parsed.module === "modpanel") {
      if (parsed.action === "select" && interaction.isUserSelectMenu() && parsed.extra) {
        const modAction = parsed.extra;
        const targetId = interaction.values[0]!;
        await interaction.update({
          embeds: [
            warningEmbed(
              `Confirmer — ${modAction}`,
              `Cible : <@${targetId}>\nRaison par défaut : panel modération.`,
            ),
          ],
          components: buildModerationConfirmRows(modAction, targetId),
        });
        return;
      }

      const action = parsed.action;
      if (action === "clear") {
        await interaction.reply({
          embeds: [warningEmbed("Clear", "Supprimer les **10** derniers messages de ce salon ?")],
          components: buildModerationConfirmRows("clear", interaction.channelId),
          ephemeral: true,
        });
        return;
      }
      if (action === "nuke") {
        await interaction.reply({
          embeds: [
            warningEmbed(
              "Nuke salon",
              "Ce salon sera cloné puis supprimé. Confirme pour continuer.",
            ),
          ],
          components: buildModerationConfirmRows("nuke", interaction.channelId),
          ephemeral: true,
        });
        return;
      }
      if (["warn", "mute", "kick", "ban"].includes(action)) {
        await interaction.reply({
          embeds: [buildSimpleEmbed("Panel mod", `Sélectionne le membre pour **${action}**.`)],
          components: buildModPanelUserSelect(action),
          ephemeral: true,
        });
        return;
      }
    }

    if (parsed.module === "automod") {
      await interaction.deferUpdate();
      const cfg = await getGuildConfig(guild.id);
      const patch = { ...cfg.automod };
      if (parsed.action === "toggle") patch.enabled = !patch.enabled;
      if (parsed.action === "caps") patch.blockCaps = !patch.blockCaps;
      if (parsed.action === "zalgo") patch.blockZalgo = !patch.blockZalgo;
      if (parsed.action === "urls") patch.blockExternalUrls = !patch.blockExternalUrls;
      await updateGuildConfig(guild.id, { automod: patch });
      const am = (await getGuildConfig(guild.id)).automod;
      await interaction.editReply({
        embeds: [
          buildSimpleEmbed(
            "Automod mis à jour",
            `État **${am.enabled ? "ON" : "OFF"}** · Caps **${am.blockCaps}** · Zalgo **${am.blockZalgo}** · URLs **${am.blockExternalUrls}**`,
          ),
        ],
        components: buildAutomodPanelRows(am.enabled),
      });
      return;
    }

    if (parsed.module === "welcome") {
      if (parsed.action === "create") {
        await interaction.deferUpdate();
        const ids = await provisionWelcomeChannels(guild);
        const cfg = await getGuildConfig(guild.id);
        await updateGuildConfig(guild.id, { welcome: { ...cfg.welcome, ...ids } });
        await interaction.editReply({
          embeds: [successEmbed("Welcome setup", `Salons créés : <#${ids.welcomeChannelId}> · <#${ids.goodbyeChannelId}>`)],
          components: buildWelcomeSetupRows(),
        });
        return;
      }
      if (parsed.action === "info") {
        const cfg = await getGuildConfig(guild.id);
        await interaction.update({
          embeds: [
            buildSimpleEmbed(
              "Config welcome",
              `Bienvenue : ${cfg.welcome.welcomeChannelId ? `<#${cfg.welcome.welcomeChannelId}>` : "—"}\nDépart : ${cfg.welcome.goodbyeChannelId ? `<#${cfg.welcome.goodbyeChannelId}>` : "—"}\nAuto-role : ${cfg.welcome.autoRoleId ? `<@&${cfg.welcome.autoRoleId}>` : "—"}`,
            ),
          ],
          components: buildWelcomeSetupRows(),
        });
      }
      return;
    }

    if (parsed.module === "levels" && parsed.action === "ping_toggle") {
      if (parsed.extra !== interaction.user.id) {
        await interaction.reply({ embeds: [errorEmbed("Réservé", "Ton propre level-up.")], ephemeral: true });
        return;
      }
      const row = await prisma.userXp.findUnique({
        where: { guildId_userId: { guildId: guild.id, userId: interaction.user.id } },
      });
      const next = !(row?.levelUpPing ?? true);
      await prisma.userXp.upsert({
        where: { guildId_userId: { guildId: guild.id, userId: interaction.user.id } },
        create: { guildId: guild.id, userId: interaction.user.id, levelUpPing: next },
        update: { levelUpPing: next },
      });
      await interaction.reply({
        embeds: [successEmbed("Level-up", next ? "Ping activé." : "Ping désactivé.")],
        ephemeral: true,
      });
      return;
    }

    if (parsed.module === "suggest" && (parsed.action === "up" || parsed.action === "down")) {
      if (!interaction.isButton()) return;
      const messageId = parsed.extra;
      if (!messageId) return;
      await interaction.deferUpdate();
      const vote = parsed.action === "up" ? 1 : -1;
      await prisma.suggestionVote.upsert({
        where: {
          guildId_messageId_userId: {
            guildId: guild.id,
            messageId,
            userId: interaction.user.id,
          },
        },
        create: { guildId: guild.id, messageId, userId: interaction.user.id, vote },
        update: { vote },
      });
      const votes = await prisma.suggestionVote.findMany({ where: { guildId: guild.id, messageId } });
      const up = votes.filter((v: { vote: number }) => v.vote > 0).length;
      const down = votes.filter((v: { vote: number }) => v.vote < 0).length;
      await interaction.update({
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(customId("suggest", "up", messageId))
              .setLabel(`👍 ${up}`)
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(customId("suggest", "down", messageId))
              .setLabel(`👎 ${down}`)
              .setStyle(ButtonStyle.Danger),
          ),
        ],
      });
      return;
    }

    if (parsed.module === "ticket") {
      const member = interaction.member as GuildMember;
      if (parsed.action === "type" && interaction.isStringSelectMenu()) {
        const ticketType = interaction.values[0] ?? "support";
        await interaction.showModal(buildTicketReasonModal(ticketType));
        return;
      }
      if (parsed.action === "open") {
        await interaction.deferReply({ ephemeral: true });
        const ch = await ticketService.openTicket(guild, member, client);
        await interaction.editReply({ embeds: [successEmbed("Ticket", `<#${ch.id}>`)] });
        await ch.send({ embeds: [buildTicketOpenEmbed(member.user)], components: buildTicketRow(ch.id) });
        return;
      }
      const channelId = parsed.extra ?? interaction.channelId;
      if (parsed.action === "claim") {
        await ticketService.claim(channelId, interaction.user.id, client);
        await interaction.reply({ embeds: [successEmbed("Claim", "Ticket pris en charge.")], ephemeral: true });
        return;
      }
      if (parsed.action === "close") {
        await interaction.deferReply({ ephemeral: true });
        await ticketService.close(channelId, client);
        await interaction.editReply({ embeds: [successEmbed("Fermé", "Ticket fermé.")] });
        return;
      }
    }

    if (parsed.module === "music") {
      const guildIdMusic = parsed.extra ?? guild.id;
      const player = musicManager.getPlayer(guildIdMusic);
      if (!player) {
        await interaction.reply({ embeds: [errorEmbed("Musique", "Aucune lecture.")], ephemeral: true });
        return;
      }
      if (parsed.action === "pause") {
        player.pause(!player.paused);
        await interaction.reply({
          embeds: [successEmbed("Musique", player.paused ? "Pause." : "Reprise.")],
          ephemeral: true,
        });
        return;
      }
      if (parsed.action === "skip") {
        await player.skip();
        await interaction.reply({ embeds: [successEmbed("Musique", "Piste suivante.")], ephemeral: true });
        return;
      }
      if (parsed.action === "stop") {
        player.destroy();
        await interaction.reply({ embeds: [successEmbed("Musique", "Arrêté.")], ephemeral: true });
        return;
      }
      if (parsed.action === "queue") {
        const q = player.queue.map((t) => t.title).slice(0, 10).join("\n") || "(vide)";
        await interaction.reply({ embeds: [buildSimpleEmbed("File d'attente", q)], ephemeral: true });
        return;
      }
      if (parsed.action === "shuffle") {
        const n = musicManager.shuffle(guildIdMusic);
        await interaction.reply({
          embeds: [successEmbed("Shuffle", `File mélangée (**${n}**).`)],
          ephemeral: true,
        });
      }
      return;
    }

    if (parsed.module === "logs" && parsed.action === "create") {
      await interaction.deferReply({ ephemeral: true });
      const channels = await logProvisioningService.provisionAll(guild);
      await interaction.editReply({
        embeds: [successEmbed("Logs", `${Object.keys(channels).length} salons créés.`)],
      });
      return;
    }

    if (parsed.module === "template") {
      if (parsed.action === "list") {
        const templates = listTemplates();
        const body = templates.map((t) => `• **${t.label}** (\`${t.key}\`) — ${t.description}`).join("\n") || "Aucun template.";
        await interaction.update({
          embeds: [buildSimpleEmbed("📚 Templates disponibles", body, 0x5865f2)],
          components: buildTemplatePanelRows(),
        });
        return;
      }

      if (parsed.action === "apply_menu") {
        await interaction.update({
          embeds: [buildSimpleEmbed("🧩 Appliquer un template", "Choisis un modèle dans le menu ci-dessous.", 0x57f287)],
          components: [buildTemplateApplySelect(), ...buildTemplatePanelRows()],
        });
        return;
      }

      if (parsed.action === "reset_warn") {
        await interaction.update({
          embeds: [
            warningEmbed(
              "Reset complet",
              "⚠️ **Action destructive** — supprime salons, catégories et rôles (sauf @everyone et rôles gérés).\n\nConfirme pour continuer.",
            ),
          ],
          components: buildTemplateResetConfirmRows(),
        });
        return;
      }

      if (parsed.action === "reset_cancel") {
        const count = listTemplates().length;
        await interaction.update({
          embeds: [
            buildSimpleEmbed(
              "🧩 Panneau templates",
              `**${count}** modèles disponibles.\n\n• **Appliquer** — crée rôles, catégories et salons\n• **Reset complet** — repartir de zéro (destructif)`,
              0x5865f2,
            ),
          ],
          components: buildTemplatePanelRows(),
        });
        return;
      }

      if (parsed.action === "reset_confirm") {
        await interaction.deferUpdate();
        const result = await templateService.resetGuildStructure(guild, interaction.user.id);
        const embed = warningEmbed("Reset terminé", "Nettoyage complet du serveur exécuté.");
        embed.addFields(
          { name: "Salons supprimés", value: String(result.deletedChannels), inline: true },
          { name: "Catégories supprimées", value: String(result.deletedCategories), inline: true },
          { name: "Rôles supprimés", value: String(result.deletedRoles), inline: true },
        );
        await interaction.editReply({ embeds: [embed], components: buildTemplatePanelRows() });
        return;
      }

      if (parsed.action === "apply" && interaction.isStringSelectMenu()) {
        await interaction.deferUpdate();
        const templateKey = interaction.values[0]!;
        const template = await templateService.apply(guild, templateKey, client, interaction.user.id, { createLogs: false });
        await interaction.editReply({
          embeds: [
            successEmbed(
              "Template appliqué",
              `**${template.label}** (\`${templateKey}\`) a été appliqué.\nUtilise \`/logs create\` si tu veux les salons logs.`,
            ),
          ],
          components: buildTemplatePanelRows(),
        });
      }
    }
  });
}

export function buildSentinelHub() {
  return buildSentinelMasterHubRows();
}

export function buildLogsPanel(): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("sentinel:logs:types")
        .setPlaceholder("Types de logs configurés")
        .addOptions(
          LOG_TYPES.map((t) => ({
            label: t,
            value: t,
            description: `Salon logs-${t.replace("_", "-")}`,
          })),
        )
        .setDisabled(true),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId("logs", "create"))
        .setLabel("Créer tous les salons logs")
        .setStyle(ButtonStyle.Success),
    ),
  ];
}
