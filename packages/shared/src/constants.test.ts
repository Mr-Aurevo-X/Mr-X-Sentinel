import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_DASHBOARD_URL, dashboardGuildUrl, dashboardPublicUrl } from "./constants.js";

describe("dashboardPublicUrl", () => {
  const prev = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = prev;
  });

  it("falls back to localhost when NEXTAUTH_URL is empty", () => {
    delete process.env.NEXTAUTH_URL;
    expect(dashboardPublicUrl()).toBe(DEFAULT_DASHBOARD_URL);
  });

  it("strips a trailing slash", () => {
    process.env.NEXTAUTH_URL = "https://panel.example/";
    expect(dashboardPublicUrl()).toBe("https://panel.example");
  });
});

describe("dashboardGuildUrl", () => {
  const prev = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = prev;
  });

  it("appends /guilds/<id> to the public origin", () => {
    process.env.NEXTAUTH_URL = "https://panel.example/";
    expect(dashboardGuildUrl("123456789012345678")).toBe(
      "https://panel.example/guilds/123456789012345678",
    );
  });
});
