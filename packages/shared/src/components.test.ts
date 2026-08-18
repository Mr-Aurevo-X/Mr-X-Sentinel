import { describe, it, expect } from "vitest";
import { customId, parseCustomId } from "./components.js";

describe("parseCustomId", () => {
  it("parses ids without extra", () => {
    expect(parseCustomId(customId("mod", "cancel"))).toEqual({
      module: "mod",
      action: "cancel",
      extra: undefined,
    });
  });

  it("joins extra after the third colon for mute confirm", () => {
    expect(parseCustomId(customId("mod", "confirm", "mute:123"))).toEqual({
      module: "mod",
      action: "confirm",
      extra: "mute:123",
    });
  });

  it("joins extra for leaderboard tab:page", () => {
    expect(parseCustomId("sentinel:lb:next:economy:2")).toEqual({
      module: "lb",
      action: "next",
      extra: "economy:2",
    });
  });

  it("rejects ids that are not sentinel", () => {
    expect(parseCustomId("other:mod:confirm")).toBeNull();
  });
});
