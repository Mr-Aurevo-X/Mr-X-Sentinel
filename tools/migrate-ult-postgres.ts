/**
 * Migration Mr-X-Ult (PostgreSQL) → Mr-X Sentinel (Prisma).
 *
 * Usage:
 *   pnpm migrate:ult -- --source-url=postgresql://user:pass@host:5432/ult --guild-id=123456789
 *   pnpm migrate:ult -- --source-url=... --guild-id=... --dry-run
 */
import pg from "pg";
import { prisma, getGuildConfig, updateGuildConfig, getOrCreateGuild } from "@sentinel/database";

const { Pool } = pg;

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`));
  return hit?.slice(name.length + 1);
}

const dryRun = process.argv.includes("--dry-run");
const sourceUrl = arg("--source-url");
const guildId = arg("--guild-id");

if (!sourceUrl || !guildId) {
  console.error("Requis : --source-url=... --guild-id=...");
  process.exit(1);
}

type UltGuildRow = Record<string, unknown>;
type UltUserRow = {
  user_id: string;
  guild_id: string;
  xp: string | number;
  level: number;
  balance: string | number;
  bank?: string | number;
  streak?: number;
};

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: sourceUrl });
  console.log(`Migration Ult → Sentinel (guild ${guildId})${dryRun ? " [DRY-RUN]" : ""}`);

  const { rows: guildRows } = await pool.query<UltGuildRow>(
    "SELECT * FROM guild_configs WHERE guild_id = $1",
    [guildId],
  );
  if (!guildRows[0]) {
    console.error("guild_configs introuvable pour ce guild_id");
    process.exit(1);
  }
  const g = guildRows[0];

  const cfgPatch = {
    economy: {
      dailyMin: Number(g.daily_min ?? 500),
      dailyMax: Number(g.daily_max ?? 1000),
      workMin: Number(g.work_min ?? 100),
      workMax: Number(g.work_max ?? 500),
    },
    automod: {
      enabled: Boolean(g.automod_enabled),
      wordBlacklist: [] as string[],
      maxMentions: Number(g.automod_mention_threshold ?? 5),
      blockCaps: true,
      capsRatioLimit: Number(g.automod_caps_threshold ?? 70) / 100,
    },
    levels: {
      levelUpChannelId: g.level_up_channel_id ? String(g.level_up_channel_id) : null,
    },
    welcome: {
      welcomeChannelId: g.welcome_channel_id ? String(g.welcome_channel_id) : null,
      goodbyeChannelId: g.goodbye_channel_id ? String(g.goodbye_channel_id) : null,
      autoRoleId: g.auto_role_id ? String(g.auto_role_id) : null,
    },
    tickets: {
      categoryId: g.ticket_category_id ? String(g.ticket_category_id) : null,
      supportRoleIds: g.ticket_support_role_id ? [String(g.ticket_support_role_id)] : [],
    },
    channels: {
      spamChannelId: g.spam_channel_id ? String(g.spam_channel_id) : null,
      counterChannelId: g.counter_channel_id ? String(g.counter_channel_id) : null,
      counterTemplate: "Membres: {count}",
    },
    starboard: {
      enabled: Boolean(g.starboard_channel_id),
      channelId: g.starboard_channel_id ? String(g.starboard_channel_id) : null,
      threshold: Number(g.starboard_threshold ?? 3),
    },
    antiRaid: {
      enabled: Boolean(g.antiraid_enabled),
      joinLimit: Number(g.antiraid_threshold ?? 10),
    },
  };

  const { rows: users } = await pool.query<UltUserRow>(
    "SELECT * FROM users WHERE guild_id = $1",
    [guildId],
  );

  const { rows: warnings } = await pool.query<{
    user_id: string;
    moderator_id: string;
    reason: string;
    created_at: Date;
  }>("SELECT * FROM warnings WHERE guild_id = $1", [guildId]);

  console.log(`  guild_configs: 1 ligne`);
  console.log(`  users: ${users.length}`);
  console.log(`  warnings: ${warnings.length}`);

  if (dryRun) {
    await pool.end();
    return;
  }

  await getOrCreateGuild(guildId);
  const current = await getGuildConfig(guildId);
  await updateGuildConfig(guildId, {
    economy: { ...current.economy, ...cfgPatch.economy },
    automod: { ...current.automod, ...cfgPatch.automod },
    levels: { ...current.levels, ...cfgPatch.levels },
    welcome: { ...current.welcome, ...cfgPatch.welcome },
    tickets: { ...current.tickets, ...cfgPatch.tickets },
    channels: { ...current.channels, ...cfgPatch.channels },
    starboard: { ...current.starboard, ...cfgPatch.starboard },
    antiRaid: { ...current.antiRaid, ...cfgPatch.antiRaid },
  });

  if (g.mod_log_channel_id) {
    await prisma.guild.update({
      where: { id: guildId },
      data: { modLogChannelId: String(g.mod_log_channel_id) },
    });
  }

  for (const u of users) {
    const uid = String(u.user_id);
    await prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId: uid } },
      create: {
        guildId,
        userId: uid,
        cash: Number(u.balance ?? 0),
        bank: Number(u.bank ?? 0),
      },
      update: {
        cash: Number(u.balance ?? 0),
        bank: Number(u.bank ?? 0),
      },
    });
    await prisma.userXp.upsert({
      where: { guildId_userId: { guildId, userId: uid } },
      create: {
        guildId,
        userId: uid,
        xp: Number(u.xp ?? 0),
        level: Number(u.level ?? 0),
        streak: Number(u.streak ?? 0),
      },
      update: {
        xp: Number(u.xp ?? 0),
        level: Number(u.level ?? 0),
        streak: Number(u.streak ?? 0),
      },
    });
  }

  for (const w of warnings) {
    await prisma.modCase.create({
      data: {
        guildId,
        userId: String(w.user_id),
        moderatorId: String(w.moderator_id),
        type: "WARN",
        reason: w.reason,
        createdAt: w.created_at,
      },
    });
  }

  await pool.end();
  console.log("Migration terminée.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
