import { describe, it, expect } from "vitest";
import { evaluateGhostAudit, GHOST_LOCKDOWN_COUNT, GHOST_WINDOW_SEC } from "./ghostAudit.js";

describe("evaluateGhostAudit", () => {
  it("logs a single ghost without lockdown or restore", () => {
    const decision = evaluateGhostAudit(1);
    expect(decision.severity).toBe("HIGH");
    expect(decision.shouldLockdown).toBe(false);
    expect(decision.reason).toMatch(/unknown executor/i);
  });

  it("lockdowns after repeated ghosts without rolling back", () => {
    const decision = evaluateGhostAudit(GHOST_LOCKDOWN_COUNT);
    expect(decision.severity).toBe("CRITICAL");
    expect(decision.shouldLockdown).toBe(true);
    expect(decision.reason).toContain(String(GHOST_WINDOW_SEC));
  });
});
