import { describe, it, expect } from "vitest";
import { capsRatio, hasDiscordInvite, hasZalgo } from "./automodText.js";

describe("automodText", () => {
  it("capsRatio is 0 for short text", () => {
    expect(capsRatio("ABC")).toBe(0);
  });

  it("capsRatio detects excessive caps", () => {
    expect(capsRatio("HELLO WORLD TEST")).toBeGreaterThan(0.9);
  });

  it("detects discord invites", () => {
    expect(hasDiscordInvite("join https://discord.gg/test")).toBe(true);
    expect(hasDiscordInvite("hello")).toBe(false);
  });

  it("detects zalgo combining marks", () => {
    expect(hasZalgo("e\u0301")).toBe(true);
    expect(hasZalgo("normal")).toBe(false);
  });
});
