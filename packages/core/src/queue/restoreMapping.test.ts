import { describe, it, expect } from "vitest";
import {
  GUILD_CATEGORY_TYPE,
  keepRestoreOverwrite,
  orderChannelsForRestore,
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

describe("resolveRestoreParentId", () => {
  it("uses the remapped category and drops unknown parents", () => {
    const idMap = new Map([["old-cat", "new-cat"]]);
    expect(resolveRestoreParentId("old-cat", idMap)).toBe("new-cat");
    expect(resolveRestoreParentId("gone", idMap)).toBeNull();
    expect(resolveRestoreParentId(null, idMap)).toBeNull();
  });
});
