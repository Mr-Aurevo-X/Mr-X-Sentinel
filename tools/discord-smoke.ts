#!/usr/bin/env npx tsx
/**
 * Optional live Discord smoke (requires DISCORD_TOKEN).
 * Verifies the bot application is reachable via Discord API.
 */
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.log("○ discord-smoke skipped (no DISCORD_TOKEN)");
  process.exit(0);
}

async function main() {
  const res = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) {
    console.error(`✗ Discord API: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const me = (await res.json()) as { username: string; id: string };
  console.log(`✓ Discord bot: ${me.username} (${me.id})`);

  const guildId = process.env.DISCORD_GUILD_ID;
  if (guildId) {
    const g = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (g.ok) {
      const guild = (await g.json()) as { name: string };
      console.log(`✓ Guild access: ${guild.name}`);
    } else {
      console.warn(`○ Guild ${guildId} not accessible (invite bot?)`);
    }
  }
  console.log("\nDiscord smoke passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
