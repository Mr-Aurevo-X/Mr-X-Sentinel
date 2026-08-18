import { describe, expect, it } from "vitest";
import { filterManagedGuilds, guildsLoadMessage } from "./managed-guilds.js";

describe("filterManagedGuilds", () => {
  it("keeps the owner even without Manage Guild bit", () => {
    expect(
      filterManagedGuilds([
        { id: "1", name: "Mine", icon: null, owner: true, permissions: "0" },
        { id: "2", name: "Other", icon: null, owner: false, permissions: "0" },
      ]).map((g) => g.id),
    ).toEqual(["1"]);
  });

  it("keeps Manage Guild (0x20) without owner", () => {
    expect(
      filterManagedGuilds([
        { id: "3", name: "Staff", icon: null, owner: false, permissions: "32" },
      ]).map((g) => g.id),
    ).toEqual(["3"]);
  });
});

describe("guildsLoadMessage", () => {
  it("explains a missing Discord access token", () => {
    expect(guildsLoadMessage("no_token")).toMatch(/reconnecte/i);
  });

  it("includes the Discord HTTP status when the list call fails", () => {
    expect(guildsLoadMessage("discord", 401)).toMatch(/401/);
  });
});
