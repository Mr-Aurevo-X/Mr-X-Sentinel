import { describe, expect, it } from "vitest";
import {
  defaultCustomCommandDescription,
  normalizeCustomCommandName,
  validateCustomCommandName,
} from "./custom-command-name.js";

describe("custom command names", () => {
  it("normalizes to lowercase and trims", () => {
    expect(normalizeCustomCommandName("  CommentFaire  ")).toBe("commentfaire");
  });

  it("accepts Discord-style lowercase names", () => {
    expect(validateCustomCommandName("commentfaire")).toEqual({ ok: true, name: "commentfaire" });
    expect(validateCustomCommandName("hello_world")).toEqual({ ok: true, name: "hello_world" });
    expect(validateCustomCommandName("hello-world")).toEqual({ ok: true, name: "hello-world" });
    expect(validateCustomCommandName("CMD123")).toEqual({ ok: true, name: "cmd123" });
  });

  it("rejects spaces, empty, too long, and illegal characters", () => {
    expect(validateCustomCommandName("comment faire")).toEqual({ ok: false, reason: "invalid" });
    expect(validateCustomCommandName("")).toEqual({ ok: false, reason: "invalid" });
    expect(validateCustomCommandName("   ")).toEqual({ ok: false, reason: "invalid" });
    expect(validateCustomCommandName("a".repeat(33))).toEqual({ ok: false, reason: "invalid" });
    expect(validateCustomCommandName("hello!")).toEqual({ ok: false, reason: "invalid" });
    expect(validateCustomCommandName("café")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects management names even without an extra reserved list", () => {
    expect(validateCustomCommandName("addcommand")).toEqual({ ok: false, reason: "reserved" });
    expect(validateCustomCommandName("RemoveCommand")).toEqual({ ok: false, reason: "reserved" });
    expect(validateCustomCommandName("LISTCOMMANDS")).toEqual({ ok: false, reason: "reserved" });
  });

  it("rejects built-in slash names passed as reserved", () => {
    const reserved = ["ban", "help", "play", "setup"];
    expect(validateCustomCommandName("ban", reserved)).toEqual({ ok: false, reason: "reserved" });
    expect(validateCustomCommandName("HELP", reserved)).toEqual({ ok: false, reason: "reserved" });
    expect(validateCustomCommandName("tutoriel", reserved)).toEqual({ ok: true, name: "tutoriel" });
  });

  it("builds a Discord description from the first 100 chars of the body", () => {
    expect(defaultCustomCommandDescription("Hello\nworld")).toBe("Hello world");
    expect(defaultCustomCommandDescription("x".repeat(150))).toHaveLength(100);
  });
});
