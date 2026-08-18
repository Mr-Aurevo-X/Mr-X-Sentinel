import { describe, it, expect } from "vitest";
import { defaultGuildFeatures } from "@sentinel/shared";
import {
  shouldRunAntiNuke,
  shouldRunAntiRaid,
  shouldRunAutomod,
  shouldRunPermissionGuard,
  shouldRunSnapshots,
} from "./featureGates.js";

function features(patch: Partial<ReturnType<typeof defaultGuildFeatures>>) {
  return { ...defaultGuildFeatures(), ...patch };
}

describe("AutomodModule feature gate", () => {
  it("is a no-op when features.automod is off", () => {
    expect(shouldRunAutomod(features({ automod: false }), true)).toBe(false);
  });

  it("still requires the automod engine flag", () => {
    expect(shouldRunAutomod(features({ automod: true }), false)).toBe(false);
    expect(shouldRunAutomod(features({ automod: true }), true)).toBe(true);
  });
});

describe("AntiNukeModule feature gate", () => {
  it("is a no-op when features.security is off", () => {
    expect(shouldRunAntiNuke(features({ security: false }), true)).toBe(false);
  });

  it("runs only when security and anti-nuke are on", () => {
    expect(shouldRunAntiNuke(features({ security: true }), true)).toBe(true);
    expect(shouldRunAntiNuke(features({ security: true }), false)).toBe(false);
  });
});

describe("AntiRaidModule feature gate", () => {
  it("is a no-op when features.security is off", () => {
    expect(shouldRunAntiRaid(features({ security: false }), true)).toBe(false);
    expect(shouldRunAntiRaid(features({ security: true }), true)).toBe(true);
  });
});

describe("PermissionGuardModule feature gate", () => {
  it("is a no-op when features.security is off", () => {
    expect(shouldRunPermissionGuard(features({ security: false }))).toBe(false);
    expect(shouldRunPermissionGuard(features({ security: true }))).toBe(true);
  });
});

describe("snapshots feature gate", () => {
  it("is a no-op when features.snapshots is off", () => {
    expect(shouldRunSnapshots(features({ snapshots: false }))).toBe(false);
    expect(shouldRunSnapshots(features({ snapshots: true }))).toBe(true);
  });
});
