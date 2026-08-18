import { describe, it, expect } from "vitest";
import { assertSafePlayQuery, isAllowedPlayQuery } from "./play-query.js";

describe("play query allowlist", () => {
  it("allows search titles and YouTube/SoundCloud URLs", () => {
    expect(isAllowedPlayQuery("never gonna give you up")).toBe(true);
    expect(isAllowedPlayQuery("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isAllowedPlayQuery("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isAllowedPlayQuery("https://soundcloud.com/artist/track")).toBe(true);
    expect(isAllowedPlayQuery("https://artist.bandcamp.com/track/song")).toBe(true);
    expect(isAllowedPlayQuery("https://www.twitch.tv/videos/1")).toBe(true);
    expect(isAllowedPlayQuery("https://vimeo.com/123")).toBe(true);
    expect(isAllowedPlayQuery("https://www.nicovideo.jp/watch/sm9")).toBe(true);
  });

  it("rejects raw HTTP and metadata IPs", () => {
    expect(isAllowedPlayQuery("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedPlayQuery("https://example.com/track.mp3")).toBe(false);
    expect(isAllowedPlayQuery("https://user:pass@www.youtube.com/watch?v=x")).toBe(false);
    expect(isAllowedPlayQuery("//169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedPlayQuery("169.254.169.254/latest/meta-data")).toBe(false);
    expect(() => assertSafePlayQuery("http://127.0.0.1/x")).toThrow(/HTTP directs/);
  });
});
