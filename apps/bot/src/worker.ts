import "./load-env.js";
import { Client, GatewayIntentBits } from "discord.js";
import {
  startLockdownWorker,
  startRestoreWorker,
  startSnapshotCaptureWorker,
} from "@sentinel/core";
import { config, validateConfig } from "./config.js";

validateConfig();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

await client.login(config.token);

const restoreWorker = startRestoreWorker(() => client);
const lockdownWorker = startLockdownWorker(() => client);
const captureWorker = startSnapshotCaptureWorker(() => client);
console.log("[Worker] Restore, lockdown, and snapshot capture workers started");

process.on("SIGINT", async () => {
  await restoreWorker.close();
  await lockdownWorker.close();
  await captureWorker.close();
  client.destroy();
  process.exit(0);
});
