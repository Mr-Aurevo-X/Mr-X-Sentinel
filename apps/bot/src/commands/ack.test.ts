import { describe, expect, it } from "vitest";
import {
  componentAckMode,
  formatGatewayPing,
  isInfraUnavailableError,
  pickGatewayPing,
  shouldDeferSlash,
} from "./ack.js";

describe("shouldDeferSlash", () => {
  it("defers every slash including ping and panel", () => {
    expect(shouldDeferSlash("ping")).toBe(true);
    expect(shouldDeferSlash("botinfo")).toBe(true);
    expect(shouldDeferSlash("avatar")).toBe(true);
    expect(shouldDeferSlash("panel")).toBe(true);
    expect(shouldDeferSlash("mute")).toBe(true);
    expect(shouldDeferSlash("template")).toBe(true);
    expect(shouldDeferSlash("help")).toBe(true);
  });

  it("honors skipDefer for an already-acked interaction", () => {
    expect(shouldDeferSlash("mute", { skipDefer: true })).toBe(false);
    expect(shouldDeferSlash("ping", { skipDefer: true })).toBe(false);
  });
});

describe("formatGatewayPing", () => {
  it("shows n/d before the first heartbeat ACK", () => {
    expect(formatGatewayPing(-1)).toBe("n/d");
    expect(formatGatewayPing(Number.NaN)).toBe("n/d");
  });

  it("shows rounded milliseconds when the shard has a ping", () => {
    expect(formatGatewayPing(42)).toBe("42 ms");
    expect(formatGatewayPing(41.6)).toBe("42 ms");
  });
});

describe("pickGatewayPing", () => {
  it("prefers a ready shard ping when the manager is still -1", () => {
    expect(pickGatewayPing(-1, [-1, 88])).toBe(88);
  });

  it("falls back to the manager ping when no shard is ready", () => {
    expect(pickGatewayPing(-1, [-1])).toBe(-1);
  });
});

describe("isInfraUnavailableError", () => {
  it("detects Prisma connection failures", () => {
    expect(isInfraUnavailableError(new Error("Can't reach database server"))).toBe(true);
    const prismaInit = new Error("P1001");
    prismaInit.name = "PrismaClientInitializationError";
    expect(isInfraUnavailableError(prismaInit)).toBe(true);
    expect(isInfraUnavailableError(new Error("Membre introuvable"))).toBe(false);
  });
});

describe("componentAckMode", () => {
  it("acks panel edits in place", () => {
    expect(componentAckMode("template", "apply")).toBe("update");
    expect(componentAckMode("help", "tier")).toBe("update");
    expect(componentAckMode("mod", "confirm")).toBe("update");
    expect(componentAckMode("modpanel", "select")).toBe("update");
  });

  it("opens a new ephemeral ACK for reply-style modules", () => {
    expect(componentAckMode("music", "skip")).toBe("ephemeral");
    expect(componentAckMode("ticket", "open")).toBe("ephemeral");
    expect(componentAckMode("modpanel", "mute")).toBe("ephemeral");
    expect(componentAckMode("verify", "button")).toBe("ephemeral");
  });

  it("does not ACK before showModal", () => {
    expect(componentAckMode("ticket", "type")).toBe("skip");
  });
});
