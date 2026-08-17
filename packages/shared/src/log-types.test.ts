import { describe, it, expect } from "vitest";
import { ACTIVE_LOG_TYPES, isParkedLogType, LOG_TYPES } from "./log-types.js";

describe("log types", () => {
  it("keeps ai and brain in the schema list", () => {
    expect(LOG_TYPES).toContain("ai");
    expect(LOG_TYPES).toContain("brain");
  });

  it("hides parked types from provisioning", () => {
    expect(ACTIVE_LOG_TYPES).not.toContain("ai");
    expect(ACTIVE_LOG_TYPES).not.toContain("brain");
    expect(isParkedLogType("ai")).toBe(true);
    expect(isParkedLogType("admin")).toBe(false);
    expect(ACTIVE_LOG_TYPES).toHaveLength(10);
  });
});
