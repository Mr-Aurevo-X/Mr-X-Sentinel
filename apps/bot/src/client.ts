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
  logService,
} from "@sentinel/core";
import { getOrCreateGuild } from "@sentinel/database";
import { t } from "./i18n/index.js";
import { handleInteraction } from "./commands/index.js";

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
      GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.GuildMember, Partials.Message],
  });

  const antiNuke = new AntiNukeModule(client);
  const antiRaid = new AntiRaidModule(client);
  const automod = new AutomodModule(client);
  const permGuard = new PermissionGuardModule(client);
  const moderation = new ModerationService(client);

  (client as Client & { moderation: ModerationService }).moderation = moderation;

  client.once(Events.ClientReady, async (c) => {
    await getRedis().connect().catch(() => getRedis());
    c.user.setActivity("Mr-X Sentinel", { type: ActivityType.Watching });
    logger.info(t("ready", "fr", { guilds: String(c.guilds.cache.size) }));

    for (const guild of c.guilds.cache.values()) {
      await getOrCreateGuild(guild.id);
    }

    setInterval(
      () => {
        for (const guild of c.guilds.cache.values()) {
          void snapshotService.capture(guild, "auto").catch(() => undefined);
        }
      },
      6 * 60 * 60 * 1000,
    );
  });

  client.on(Events.GuildCreate, async (guild) => {
    await getOrCreateGuild(guild.id);
    await snapshotService.capture(guild, "initial").catch(() => undefined);
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void handleInteraction(interaction, moderation, client);
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    const features = await getGuildFeatures(member.guild.id);
    if (!features.community) return;
    await logService.log(client, member.guild.id, "join_leave", {
      title: "Membre rejoint",
      description: `${member.user.tag} (${member.user.id})`,
      actorId: member.user.id,
    });
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    if (!member.guild) return;
    const features = await getGuildFeatures(member.guild.id);
    if (!features.community) return;
    await logService.log(client, member.guild.id, "join_leave", {
      title: "Membre parti",
      description: `${member.user?.tag ?? "Inconnu"} (${member.id})`,
    });
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const features = await getGuildFeatures(message.guild.id);
    if (!features.levels) return;
    const result = await levelsService.addMessageXp(message.guild.id, message.author.id);
    if (result.leveledUp) {
      await levelsService.logLevelUp(client, message.guild.id, message.author.id, result.level);
    }
  });

  antiNuke.register();
  antiRaid.register();
  automod.register();
  permGuard.register();

  return client;
}
