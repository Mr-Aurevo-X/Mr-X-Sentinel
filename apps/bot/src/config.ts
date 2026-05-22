import "./load-env.js";

export const config = {
  token: process.env.DISCORD_TOKEN ?? "",
  clientId: process.env.DISCORD_CLIENT_ID ?? "",
  shardCount: process.env.SHARD_COUNT ? parseInt(process.env.SHARD_COUNT, 10) : undefined,
};

export function validateConfig(): void {
  if (!config.token) throw new Error("DISCORD_TOKEN is required");
  if (!config.clientId) throw new Error("DISCORD_CLIENT_ID is required");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
}
