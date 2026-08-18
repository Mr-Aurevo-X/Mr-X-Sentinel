import { describe, it, expect } from "vitest";
import { ACTIVE_LOG_TYPES, LOG_TYPES } from "./log-types.js";

describe("log types", () => {
  it("has no ai or brain channels", () => {
    expect(LOG_TYPES).not.toContain("ai");
    expect(LOG_TYPES).not.toContain("brain");
    expect(ACTIVE_LOG_TYPES).toEqual(LOG_TYPES);
    expect(LOG_TYPES).toHaveLength(10);
  });
});
