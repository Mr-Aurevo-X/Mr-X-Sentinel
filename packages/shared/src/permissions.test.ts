import { describe, it, expect } from "vitest";
import { hasDangerousPermissions, DANGEROUS_PERM_BITS } from "./permissions.js";

describe("permissions", () => {
  it("flags administrator bit", () => {
    const admin = 8n;
    expect(hasDangerousPermissions(admin)).toBe(true);
  });

  it("returns false for send-messages only", () => {
    const perms = 2048n;
    expect(hasDangerousPermissions(perms)).toBe(false);
  });

  it("exports dangerous bits list", () => {
    expect(DANGEROUS_PERM_BITS.length).toBeGreaterThan(3);
  });
});
