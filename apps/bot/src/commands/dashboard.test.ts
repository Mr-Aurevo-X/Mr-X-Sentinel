import { PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { describe, expect, it } from "vitest";
import { commands } from "./definitions/index.js";
import { resolveSlashTier } from "./permissions.js";

describe("/dashboard", () => {
  it("is registered as a guild-owner slash command", () => {
    const cmd = commands.find((c) => c.name === "dashboard");
    expect(cmd).toBeDefined();
    expect(cmd!.toJSON().default_member_permissions).toBe(String(PermissionFlagsBits.Administrator));
    expect(
      resolveSlashTier({
        commandName: "dashboard",
        options: { getSubcommand: () => null },
      } as unknown as ChatInputCommandInteraction),
    ).toBe("guild_owner");
  });
});
