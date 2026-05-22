import { REST, Routes } from "discord.js";
import { commands } from "./commands/definitions.js";
import { config, validateConfig } from "./config.js";

validateConfig();

const rest = new REST({ version: "10" }).setToken(config.token);

await rest.put(Routes.applicationCommands(config.clientId), {
  body: commands.map((c) => c.toJSON()),
});

console.log(`Deployed ${commands.length} global commands.`);
