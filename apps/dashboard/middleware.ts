import { encode, getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookieHeaderWithSessionToken } from "@sentinel/shared/cookie-header";
import {
  discordTokenNeedsRefresh,
  refreshDiscordToken,
  sessionTokenCookieName,
  sessionTokenCookieOptions,
} from "@/lib/discord-oauth";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.next();

  const token = await getToken({ req, secret });
  if (!token) return NextResponse.next();
  if (
    !discordTokenNeedsRefresh(token.expiresAt) ||
    typeof token.refreshToken !== "string" ||
    token.refreshToken.length === 0
  ) {
    return NextResponse.next();
  }

  const refreshed = await refreshDiscordToken(token.refreshToken);
  if (!refreshed) return NextResponse.next();

  const encoded = await encode({
    token: {
      ...token,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? token.refreshToken,
      expiresAt: refreshed.expiresAt,
    },
    secret,
  });

  const cookieName = sessionTokenCookieName();
  const headers = new Headers(req.headers);
  headers.set("cookie", cookieHeaderWithSessionToken(req.headers.get("cookie"), cookieName, encoded));

  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(cookieName, encoded, sessionTokenCookieOptions());
  return res;
}

export const config = {
  matcher: ["/guilds/:path*", "/api/guilds/:path*"],
};
