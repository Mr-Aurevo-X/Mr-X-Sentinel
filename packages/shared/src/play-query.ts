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
]);

export function isAllowedPlayQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!/^https?:\/\//i.test(trimmed)) return true;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    if (ALLOWED_PLAY_HOSTS.has(host)) return true;
    return host.endsWith(".youtube.com") || host.endsWith(".soundcloud.com");
  } catch {
    return false;
  }
}

export function assertSafePlayQuery(query: string): void {
  if (!isAllowedPlayQuery(query)) {
    throw new Error(
      "Les liens HTTP directs sont désactivés. Utilise un titre ou un lien YouTube/SoundCloud.",
    );
  }
}
