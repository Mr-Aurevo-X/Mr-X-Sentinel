import { ShardingManager } from "discord.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config, validateConfig } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  validateConfig();

  const manager = new ShardingManager(join(__dirname, "shard.js"), {
    token: config.token,
    totalShards: config.shardCount ?? "auto",
    respawn: true,
  });

  manager.on("shardCreate", (shard) => {
    console.log(`[Shard] Launched shard ${shard.id}`);
  });

  await manager.spawn();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
