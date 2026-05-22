import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
loadDotenv({ path: resolve(rootDir, ".env") });

// SHARD_COUNT vide dans .env (= "") fait planter discord.js (shardCount 0)
const shardRaw = process.env.SHARD_COUNT?.trim();
if (!shardRaw || Number.isNaN(Number(shardRaw)) || Number(shardRaw) < 1) {
  delete process.env.SHARD_COUNT;
}
