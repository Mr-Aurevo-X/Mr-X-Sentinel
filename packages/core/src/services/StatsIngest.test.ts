import { describe, it, expect } from "vitest";
import { parseActiveId, statChannelKey, statChatKey, statHashKey } from "./StatsIngest.js";

describe("stats ingest keys", () => {
  it("never embeds message content in redis keys", () => {
    const content = "secret payload hello";
    const hash = statHashKey("g1", "2026081715");
    const chat = statChatKey("g1", "2026081715");
    const channel = statChannelKey("g1", "2026081715");
    expect(hash).not.toContain(content);
    expect(chat).not.toContain(content);
    expect(channel).not.toContain(content);
    expect(hash).toBe("mrx:stat:g1:2026081715");
  });

  it("parses active ids with snowflake guilds", () => {
    expect(parseActiveId("123456789012345678:2026081715")).toEqual({
      guildId: "123456789012345678",
      stamp: "2026081715",
    });
    expect(parseActiveId("bad")).toBeNull();
  });
});
