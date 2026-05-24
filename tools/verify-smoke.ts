import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;

function fail(msg: string) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

function ok(msg: string) {
  console.log(`✓ ${msg}`);
}

async function checkSlashDefinitions() {
  const mod = await import("../apps/bot/src/commands/definitions.ts");
  const commands = mod.commands as { name: string }[];
  if (!Array.isArray(commands) || commands.length < 10) {
    fail(`slash definitions: expected 10+ commands, got ${commands?.length ?? 0}`);
    return;
  }
  ok(`slash definitions (${commands.length} commands)`);
}

function checkTemplatePresets() {
  const presetsDir = join(root, "packages/core/src/modules/templates/presets");
  const files = readdirSync(presetsDir).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_"),
  );
  if (files.length < 14) {
    fail(`template presets: expected 14+, found ${files.length}`);
    return;
  }
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(presetsDir, file), "utf8")) as {
        key?: string;
        label?: string;
      };
      if (!data.key || !data.label) fail(`preset ${file}: missing key or label`);
    } catch (e) {
      fail(`preset ${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  ok(`template presets (${files.length} JSON files)`);
}

async function checkPostgres(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const { prisma } = await import("@sentinel/database");
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  if (!process.env.REDIS_URL) return false;
  try {
    const { default: Redis } = await import("ioredis");
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    const pong = await redis.ping();
    await redis.quit();
    return pong === "PONG";
  } catch {
    return false;
  }
}

async function main() {
  console.log("Mr-X Sentinel — smoke verification\n");
  try {
    await checkSlashDefinitions();
  } catch (e) {
    fail(`slash definitions: ${e instanceof Error ? e.message : String(e)}`);
  }
  checkTemplatePresets();
  if (process.env.DATABASE_URL) {
    if (await checkPostgres()) ok("PostgreSQL ping");
    else fail("PostgreSQL ping");
  } else {
    console.log("○ PostgreSQL skipped");
  }
  if (process.env.REDIS_URL) {
    if (await checkRedis()) ok("Redis ping");
    else fail("Redis ping");
  } else {
    console.log("○ Redis skipped");
  }
  if (failed > 0) process.exit(1);
  console.log("\nSmoke passed.");
}

main();
