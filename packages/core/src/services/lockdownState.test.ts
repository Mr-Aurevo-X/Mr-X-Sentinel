import { describe, it, expect } from "vitest";
import { isLockableGuildChannel, parseLockdownSnapshot } from "./lockdownState.js";

describe("parseLockdownSnapshot", () => {
  it("returns null for missing or invalid payloads", () => {
    expect(parseLockdownSnapshot(null)).toBeNull();
    expect(parseLockdownSnapshot("nope")).toBeNull();
    expect(parseLockdownSnapshot("{}")).toBeNull();
  });

  it("keeps well-formed channel rows", () => {
    const raw = JSON.stringify([
      {
        channelId: "c1",
        rateLimitPerUser: 5,
        hadEveryoneOverwrite: true,
        everyoneAllow: "0",
        everyoneDeny: "2048",
      },
    ]);
    expect(parseLockdownSnapshot(raw)).toEqual([
      {
        channelId: "c1",
        rateLimitPerUser: 5,
        hadEveryoneOverwrite: true,
        everyoneAllow: "0",
        everyoneDeny: "2048",
      },
    ]);
  });
});

describe("isLockableGuildChannel", () => {
  it("skips threads and channels without overwrites", () => {
    expect(
      isLockableGuildChannel({
        isTextBased: () => true,
        isDMBased: () => false,
        isThread: () => true,
        permissionOverwrites: {},
      }),
    ).toBe(false);
    expect(
      isLockableGuildChannel({
        isTextBased: () => true,
        isDMBased: () => false,
        isThread: () => false,
      }),
    ).toBe(false);
    expect(
      isLockableGuildChannel({
        isTextBased: () => true,
        isDMBased: () => false,
        isThread: () => false,
        permissionOverwrites: { cache: new Map() },
      }),
    ).toBe(true);
  });
});
