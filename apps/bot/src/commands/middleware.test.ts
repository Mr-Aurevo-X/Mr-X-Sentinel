import { beforeEach, describe, expect, it, vi } from "vitest";

const order: string[] = [];

vi.mock("@sentinel/database", () => ({
  getGuildConfig: vi.fn(async () => {
    order.push("db");
    return { features: { moderation: true } };
  }),
}));

vi.mock("@sentinel/core", () => ({
  isModuleEnabled: () => true,
  economyAntiCheat: { checkRateLimit: async () => undefined },
}));

vi.mock("@sentinel/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sentinel/shared")>();
  return actual;
});

import { withCommand } from "./middleware.js";

function mockInteraction() {
  const interaction = {
    deferred: false,
    replied: false,
    guild: { id: "g1" },
    user: { id: "u1" },
    commandName: "mute",
    deferReply: vi.fn(async () => {
      order.push("defer");
      interaction.deferred = true;
    }),
    editReply: vi.fn(async () => undefined),
    reply: vi.fn(async () => {
      interaction.replied = true;
    }),
  };
  return interaction;
}

describe("withCommand ACK order", () => {
  beforeEach(() => {
    order.length = 0;
  });

  it("defers before getGuildConfig for module commands", async () => {
    const interaction = mockInteraction();
    const run = withCommand(async () => undefined, { module: "moderation" });
    await run(interaction as never, {} as never);
    expect(order).toEqual(["defer", "db"]);
  });
});
