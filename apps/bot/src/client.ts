import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  Events,
} from "discord.js";
import {
  AntiNukeModule,
  AntiRaidModule,
  AutomodModule,
  PermissionGuardModule,
  ModerationService,
  snapshotService,
  getRedis,
  logger,
  levelsService,
  getGuildFeatures,
  loadGuildContext,
  bindGuildConfigPublish,
  startConfigCacheInvalidation,
  shouldRunSnapshots,
  logService,
  giveawayService,
  pollService,
  reactionRoleService,
  recordJoin,
  recordLeave,
  recordMessage,
  recordVoiceJoin,
  recordVoiceLeave,
  flushStats,
  customCommandService,
} from "@sentinel/core";
import { getOrCreateGuild, prisma } from "@sentinel/database";
import { t } from "./i18n/index.js";
import { handleInteraction } from "./commands/index.js";
import { commands } from "./commands/definitions/index.js";
import { musicManager } from "./music/MusicManager.js";
import { runStartupHealthChecks } from "./services/startup-health.js";
import { processLevelUp } from "./services/LevelUpHandler.js";
import { welcomeAnnouncer } from "./services/WelcomeAnnouncer.js";
import { registerCommunityListeners, updateMemberCounter } from "./services/CommunityListeners.js";

const slashCommandNames = commands.map((c) => c.name);

export function createClient(): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.GuildMember, Partials.Message, Partials.Reaction],
  });

  const antiNuke = new AntiNukeModule(client);
  const antiRaid = new AntiRaidModule(client);
  const automod = new AutomodModule(client);
  const permGuard = new PermissionGuardModule(client);
  const moderation = new ModerationService(client);

  (client as Client & { moderation: ModerationService }).moderation = moderation;

  client.once(Events.ClientReady, async (c) => {
    await runStartupHealthChecks();
    await getRedis().connect().catch(() => getRedis());
    bindGuildConfigPublish();
    startConfigCacheInvalidation();
    await musicManager.init(c).catch((err) => {
      logger.warn({ err }, "Lavalink indisponible — musique désactivée");
    });
    c.user.setActivity("Mr-X Sentinel", { type: ActivityType.Watching });
    logger.info(t("ready", "fr", { guilds: String(c.guilds.cache.size) }));

    for (const guild of c.guilds.cache.values()) {
      await getOrCreateGuild(guild.id);
      void customCommandService.syncGuild(guild, slashCommandNames).catch((err) => {
        logger.warn({ err, guildId: guild.id }, "custom command sync failed");
      });
    }

    setInterval(
      () => {
        for (const guild of c.guilds.cache.values()) {
          void (async () => {
            const features = await getGuildFeatures(guild.id);
            if (!shouldRunSnapshots(features)) return;
            await snapshotService.capture(guild, "auto");
          })().catch(() => undefined);
        }
      },
      6 * 60 * 60 * 1000,
    );

    setInterval(() => {
      void giveawayService.tick(c).catch(() => undefined);
      void pollService.tick(c).catch(() => undefined);
    }, 60_000);

    const runFlush = () => {
      void flushStats().catch((err) => logger.warn({ err }, "stats flush failed"));
    };
    runFlush();
    setInterval(runFlush, 5 * 60_000);
  });

  client.on(Events.GuildCreate, async (guild) => {
    await getOrCreateGuild(guild.id);
    void customCommandService.syncGuild(guild, slashCommandNames).catch((err) => {
      logger.warn({ err, guildId: guild.id }, "custom command sync failed");
    });
    const features = await getGuildFeatures(guild.id);
    if (!shouldRunSnapshots(features)) return;
    await snapshotService.capture(guild, "initial").catch(() => undefined);
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void handleInteraction(interaction, moderation, client);
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    recordJoin(member.guild.id, member.guild.memberCount);
    await updateMemberCounter(client, member.guild.id, member.guild.memberCount);
    const features = await getGuildFeatures(member.guild.id);
    if (!features.community) return;
    await welcomeAnnouncer.onMemberJoin(client, member);
  });

  registerCommunityListeners(client);

  client.on(Events.GuildMemberRemove, async (member) => {
    if (!member.guild) return;
    recordLeave(member.guild.id, member.guild.memberCount);
    await updateMemberCounter(client, member.guild.id, member.guild.memberCount);
    const features = await getGuildFeatures(member.guild.id);
    if (!features.community) return;
    await welcomeAnnouncer.onMemberLeave(client, member);
  });

  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const guildId = newState.guild.id;
    const userId = newState.id;
    const wasIn = Boolean(oldState.channelId);
    const nowIn = Boolean(newState.channelId);
    if (!wasIn && nowIn) {
      void recordVoiceJoin(guildId, userId).catch(() => undefined);
    }
    if (wasIn && !nowIn) {
      void recordVoiceLeave(guildId, userId).catch(() => undefined);
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    recordMessage(message.guild.id, message.author.id, message.channelId);
    const { features } = await loadGuildContext(message.guild.id);
    if (!features.levels) return;
    const result = await levelsService.addMessageXp(
      message.guild.id,
      message.author.id,
      message.content ?? "",
    );
    if (result.leveledUp) {
      await processLevelUp(client, message.guild, message.author.id, result);
    }
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot || !reaction.message.guild) return;
    if (reaction.partial) await reaction.fetch().catch(() => undefined);
    const emoji = reaction.emoji.name;
    if (emoji === "🎉" && reaction.message.id) {
      const g = await prisma.giveaway.findFirst({
        where: { messageId: reaction.message.id, ended: false },
      });
      if (g) await giveawayService.enter(g.id, user.id);
    }
    await reactionRoleService.handleReaction(reaction, user, true, client);
  });

  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (user.bot || !reaction.message.guild) return;
    if (reaction.partial) await reaction.fetch().catch(() => undefined);
    await reactionRoleService.handleReaction(reaction, user, false, client);
  });

  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const features = await getGuildFeatures(message.guild.id);
    if (!features.community) return;
    const content = message.partial
      ? "(message partiel)"
      : (message.content?.slice(0, 500) || "(vide)");
    await logService.log(client, message.guild.id, "message", {
      title: "Message supprimé",
      description: `${message.author?.tag ?? "?"} dans <#${message.channelId}>\n${content}`,
      actorId: message.author?.id,
    });
  });

  client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!newMsg.guild || newMsg.author?.bot) return;
    const features = await getGuildFeatures(newMsg.guild.id);
    if (!features.community) return;
    const before = oldMsg.partial ? "" : (oldMsg.content ?? "");
    const after = newMsg.content ?? "";
    if (before === after) return;
    await logService.log(client, newMsg.guild.id, "message", {
      title: "Message modifié",
      description: `<@${newMsg.author.id}> dans <#${newMsg.channelId}>\n~~${before.slice(0, 200)}~~\n→ ${after.slice(0, 200)}`,
      actorId: newMsg.author.id,
    });
  });

  antiNuke.register();
  antiRaid.register();
  automod.register();
  permGuard.register();

  return client;
}
