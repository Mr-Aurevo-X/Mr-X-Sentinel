import { config, validateConfig } from "./config.js";
import { createClient } from "./client.js";

validateConfig();
const client = createClient();
await client.login(config.token);
