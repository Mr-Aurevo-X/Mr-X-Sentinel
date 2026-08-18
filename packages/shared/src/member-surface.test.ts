import { describe, it, expect } from "vitest";
import { defaultGuildFeatures } from "./features.js";
import { helpPublicDescription, visibleMemberHubEntries } from "./member-surface.js";

describe("visibleMemberHubEntries", () => {
  it("hides economy fun levels tickets when those modules are off", () => {
    const entries = visibleMemberHubEntries(defaultGuildFeatures());
    expect(entries.map((e) => e.action)).toEqual(["help"]);
  });

  it("shows economy and tickets when enabled", () => {
    const entries = visibleMemberHubEntries({
      ...defaultGuildFeatures(),
      economy: true,
      tickets: true,
    });
    expect(entries.some((e) => e.action === "eco")).toBe(true);
    expect(entries.some((e) => e.action === "open")).toBe(true);
  });
});

describe("helpPublicDescription", () => {
  it("omits music and economy when those modules are off", () => {
    const text = helpPublicDescription(defaultGuildFeatures());
    expect(text).not.toMatch(/\/music/);
    expect(text).not.toMatch(/\/daily/);
    expect(text).not.toMatch(/\/ticket open/);
    expect(text).toMatch(/\/sentinel menu/);
  });

  it("includes music when the module is on", () => {
    expect(helpPublicDescription({ ...defaultGuildFeatures(), music: true })).toMatch(/\/music/);
  });

  it("includes tickets when the module is on", () => {
    expect(helpPublicDescription({ ...defaultGuildFeatures(), tickets: true })).toMatch(/\/ticket open/);
  });
});
