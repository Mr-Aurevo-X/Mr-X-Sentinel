/**
 * Migration SQLite legacy (Mr-X-Bot / Mr-X-Shadow) → Sentinel (Prisma/Postgres).
 *
 * Usage:
 *   pnpm migrate:legacy -- --bot-db=./economy.db --guild-id=123456789
 *   pnpm migrate:legacy -- --shadow-db=./shadow.db --guild-id=123456789 --dry-run
 */
import Database from "better-sqlite3";
import { prisma, getOrCreateGuild } from "@sentinel/database";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`));
  return hit?.slice(name.length + 1);
}

const dryRun = process.argv.includes("--dry-run");
const guildId = arg("--guild-id");
const botDbPath = arg("--bot-db");
const shadowDbPath = arg("--shadow-db");

if (!guildId || (!botDbPath && !shadowDbPath)) {
  console.error("Requis : --guild-id=... et (--bot-db=... et/ou --shadow-db=...)");
  process.exit(1);
}

type WalletRow = { user_id: string; balance?: number; bank?: number; xp?: number; level?: number };

function tableExists(db: Database.Database, name: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { name: string } | undefined;
  return Boolean(row);
}

function readWallets(db: Database.Database): WalletRow[] {
  for (const table of ["users", "user_wallets", "wallets", "economy"]) {
    if (!tableExists(db, table)) continue;
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    const names = new Set(cols.map((c) => c.name));
    if (!names.has("user_id") && !names.has("userId")) continue;
    const uidCol = names.has("user_id") ? "user_id" : "userId";
    const balanceCol = names.has("balance") ? "balance" : names.has("cash") ? "cash" : null;
    const bankCol = names.has("bank") ? "bank" : null;
    const xpCol = names.has("xp") ? "xp" : null;
    const levelCol = names.has("level") ? "level" : null;
    const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
    return rows.map((r) => ({
      user_id: String(r[uidCol]),
      balance: balanceCol ? Number(r[balanceCol] ?? 0) : 0,
      bank: bankCol ? Number(r[bankCol] ?? 0) : 0,
      xp: xpCol ? Number(r[xpCol] ?? 0) : undefined,
      level: levelCol ? Number(r[levelCol] ?? 0) : undefined,
    }));
  }
  return [];
}

async function main(): Promise<void> {
  const merged = new Map<string, WalletRow>();

  if (botDbPath) {
    const db = new Database(botDbPath, { readonly: true });
    for (const row of readWallets(db)) merged.set(row.user_id, { ...merged.get(row.user_id), ...row });
    db.close();
    console.log(`bot-db: ${merged.size} utilisateur(s) lus`);
  }

  if (shadowDbPath) {
    const db = new Database(shadowDbPath, { readonly: true });
    for (const row of readWallets(db)) {
      const prev = merged.get(row.user_id) ?? { user_id: row.user_id };
      merged.set(row.user_id, { ...prev, ...row, xp: row.xp ?? prev.xp, level: row.level ?? prev.level });
    }
    db.close();
    console.log(`shadow-db: ${merged.size} utilisateur(s) au total`);
  }

  console.log(`Migration SQLite → Sentinel (guild ${guildId})${dryRun ? " [DRY-RUN]" : ""}`);
  console.log(`  wallets/xp: ${merged.size}`);

  if (dryRun) return;

  await getOrCreateGuild(guildId);

  for (const row of merged.values()) {
    await prisma.userWallet.upsert({
      where: { guildId_userId: { guildId, userId: row.user_id } },
      create: {
        guildId,
        userId: row.user_id,
        cash: Number(row.balance ?? 0),
        bank: Number(row.bank ?? 0),
      },
      update: {
        cash: Number(row.balance ?? 0),
        bank: Number(row.bank ?? 0),
      },
    });
    if (row.xp != null) {
      await prisma.userXp.upsert({
        where: { guildId_userId: { guildId, userId: row.user_id } },
        create: {
          guildId,
          userId: row.user_id,
          xp: Number(row.xp),
          level: Number(row.level ?? 0),
        },
        update: { xp: Number(row.xp), level: Number(row.level ?? 0) },
      });
    }
  }

  await prisma.$disconnect();
  console.log("Migration SQLite terminée.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
