import "./load-env.js";
import { Client, GatewayIntentBits } from "discord.js";
import { startRestoreWorker } from "@sentinel/core";
import { config, validateConfig } from "./config.js";

validateConfig();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

await client.login(config.token);

const worker = startRestoreWorker(() => client);
console.log("[Worker] Snapshot restore worker started");

process.on("SIGINT", async () => {
  await worker.close();
  client.destroy();
  process.exit(0);
});
