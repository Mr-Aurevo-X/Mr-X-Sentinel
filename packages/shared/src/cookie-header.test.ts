import { describe, it, expect } from "vitest";
import { cookieHeaderWithSessionToken } from "./cookie-header.js";

describe("cookieHeaderWithSessionToken", () => {
  it("replaces the session cookie and drops chunked siblings", () => {
    const next = cookieHeaderWithSessionToken(
      "next-auth.session-token=old; next-auth.session-token.0=chunk; other=keep",
      "next-auth.session-token",
      "fresh",
    );
    expect(next).toBe("other=keep; next-auth.session-token=fresh");
  });

  it("creates the cookie when the header is empty", () => {
    expect(cookieHeaderWithSessionToken(null, "next-auth.session-token", "fresh")).toBe(
      "next-auth.session-token=fresh",
    );
  });
});
