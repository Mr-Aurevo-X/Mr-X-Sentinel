import { describe, it, expect } from "vitest";
import { AUTO_SNAPSHOT_KEEP, autoSnapshotIdsToDelete } from "./snapshotPrune.js";

describe("autoSnapshotIdsToDelete", () => {
  it("keeps the newest auto snapshots and deletes the rest", () => {
    const snaps = Array.from({ length: AUTO_SNAPSHOT_KEEP + 3 }, (_, i) => ({
      id: `s${i}`,
      createdAt: new Date(1_000 + i),
    }));
    const deleted = autoSnapshotIdsToDelete(snaps);
    expect(deleted).toEqual(["s2", "s1", "s0"]);
  });

  it("deletes nothing when under the keep limit", () => {
    expect(
      autoSnapshotIdsToDelete([
        { id: "a", createdAt: new Date(2) },
        { id: "b", createdAt: new Date(1) },
      ]),
    ).toEqual([]);
  });
});
