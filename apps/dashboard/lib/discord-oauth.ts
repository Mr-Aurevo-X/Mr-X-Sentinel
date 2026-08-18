export type DiscordTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

const REFRESH_SKEW_MS = 60_000;
const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const inflightRefresh = new Map<string, Promise<DiscordTokenSet | null>>();

export function discordTokenNeedsRefresh(expiresAt: number | undefined, now = Date.now()): boolean {
  if (expiresAt == null) return false;
  return now >= expiresAt * 1000 - REFRESH_SKEW_MS;
}

export function useSecureAuthCookies(): boolean {
  return (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
}

export function sessionTokenCookieName(): string {
  return useSecureAuthCookies() ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

export function sessionTokenCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureAuthCookies(),
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenSet | null> {
  const existing = inflightRefresh.get(refreshToken);
  if (existing) return existing;
  const pending = refreshDiscordTokenOnce(refreshToken).finally(() => {
    inflightRefresh.delete(refreshToken);
  });
  inflightRefresh.set(refreshToken, pending);
  return pending;
}

async function refreshDiscordTokenOnce(refreshToken: string): Promise<DiscordTokenSet | null> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) return null;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 604800),
  };
}
