const ALLOWED_PLAY_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "soundcloud.com",
  "www.soundcloud.com",
  "m.soundcloud.com",
  "on.soundcloud.com",
  "bandcamp.com",
  "www.bandcamp.com",
  "twitch.tv",
  "www.twitch.tv",
  "m.twitch.tv",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
  "nicovideo.jp",
  "www.nicovideo.jp",
]);

export function isAllowedPlayQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.startsWith("//")) return false;
    if (/^(\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#]|$)/.test(trimmed)) return false;
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_PLAY_HOSTS.has(host)) return true;
    return (
      host.endsWith(".youtube.com") ||
      host.endsWith(".soundcloud.com") ||
      host.endsWith(".bandcamp.com") ||
      host.endsWith(".twitch.tv") ||
      host.endsWith(".vimeo.com") ||
      host.endsWith(".nicovideo.jp")
    );
  } catch {
    return false;
  }
}

export function assertSafePlayQuery(query: string): void {
  if (!isAllowedPlayQuery(query)) {
    throw new Error(
      "Les liens HTTP directs sont limités à YouTube, SoundCloud, Bandcamp, Twitch, Vimeo et Nico.",
    );
  }
}
