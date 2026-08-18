import { describe, it, expect } from "vitest";
import {
  GUILD_CATEGORY_TYPE,
  idsToPurge,
  keepRestoreOverwrite,
  liveIdsFromMap,
  orderChannelsForRestore,
  parseRestoreMode,
  remapOverwriteTargetId,
  resolveRestoreParentId,
} from "./restoreMapping.js";

describe("orderChannelsForRestore", () => {
  it("puts categories first", () => {
    const ordered = orderChannelsForRestore([
      { id: "text", type: 0, parentId: "cat" },
      { id: "cat", type: GUILD_CATEGORY_TYPE, parentId: null },
    ]);
    expect(ordered.map((channel) => channel.id)).toEqual(["cat", "text"]);
  });
});

describe("remapOverwriteTargetId", () => {
  it("keeps the everyone role and remaps created roles", () => {
    const idMap = new Map([["old-role", "new-role"]]);
    expect(remapOverwriteTargetId("guild", idMap, "guild")).toBe("guild");
    expect(remapOverwriteTargetId("old-role", idMap, "guild")).toBe("new-role");
    expect(remapOverwriteTargetId("unknown", idMap, "guild")).toBe("unknown");
  });
});

describe("keepRestoreOverwrite", () => {
  it("keeps member overwrites and mapped roles", () => {
    const roles = new Set(["role-a"]);
    expect(keepRestoreOverwrite({ id: "user-1", type: 1 }, roles, "guild")).toBe(true);
    expect(keepRestoreOverwrite({ id: "role-a", type: 0 }, roles, "guild")).toBe(true);
    expect(keepRestoreOverwrite({ id: "guild", type: 0 }, roles, "guild")).toBe(true);
    expect(keepRestoreOverwrite({ id: "missing-role", type: 0 }, roles, "guild")).toBe(false);
  });
});

describe("idsToPurge", () => {
  it("drops ids that are in the snapshot or protected", () => {
    const purged = idsToPurge(["a", "b", "c", "prot"], ["a"], new Set(["prot"]));
    expect(purged).toEqual(["b", "c"]);
  });

  it("returns nothing when everything is known", () => {
    expect(idsToPurge(["a"], ["a", "b"], new Set())).toEqual([]);
  });

  it("keeps remapped live ids, not snapshot snowflakes", () => {
    const idMap = new Map([
      ["old-ch", "new-ch"],
      ["old-role", "new-role"],
    ]);
    const keep = liveIdsFromMap(idMap);
    expect(idsToPurge(["new-ch", "extra"], keep, new Set())).toEqual(["extra"]);
    expect(idsToPurge(["new-ch", "extra"], ["old-ch"], new Set())).toEqual(["new-ch", "extra"]);
  });
});

describe("parseRestoreMode", () => {
  it("defaults unknown values to repair", () => {
    expect(parseRestoreMode("full")).toBe("full");
    expect(parseRestoreMode("repair")).toBe("repair");
    expect(parseRestoreMode(undefined)).toBe("repair");
    expect(parseRestoreMode("nope")).toBe("repair");
  });
});

describe("resolveRestoreParentId", () => {
  it("uses the remapped category and drops unknown parents", () => {
    const idMap = new Map([["old-cat", "new-cat"]]);
    expect(resolveRestoreParentId("old-cat", idMap)).toBe("new-cat");
    expect(resolveRestoreParentId("gone", idMap)).toBeNull();
    expect(resolveRestoreParentId(null, idMap)).toBeNull();
  });
});
