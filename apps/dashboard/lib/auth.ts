import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import DiscordProvider from "next-auth/providers/discord";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieStoreToHeader } from "@sentinel/shared/cookie-header";
import { discordTokenNeedsRefresh } from "./discord-oauth";
import {
  filterManagedGuilds,
  type ManagedGuild,
} from "./managed-guilds";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: { scope: "identify guilds" },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      // accessToken stays JWT/server-only — never mirror to client session
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      // Refresh + cookie persist live in middleware — getServerSession cannot Set-Cookie.
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export async function getDiscordAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStoreToHeader(cookieStore);
  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader,
      },
      cookies: Object.fromEntries(cookieStore.getAll().map((cookie) => [cookie.name, cookie.value])),
    } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) return null;
  const access = token.accessToken;
  if (typeof access !== "string" || access.length === 0) return null;
  if (discordTokenNeedsRefresh(token.expiresAt)) return null;
  return access;
}

export type FetchManagedGuildsResult =
  | { ok: true; guilds: DiscordGuild[] }
  | { ok: false; status: number };

export async function fetchManagedGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const loaded = await fetchManagedGuildsResult(accessToken);
  return loaded.ok ? loaded.guilds : [];
}

export async function fetchManagedGuildsResult(accessToken: string): Promise<FetchManagedGuildsResult> {
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return { ok: false, status: res.status };
  const guilds = (await res.json()) as ManagedGuild[];
  return { ok: true, guilds: filterManagedGuilds(guilds) };
}

const SNOWFLAKE_RE = /^\d{17,20}$/;

async function loadManagedGuilds(guildId: string): Promise<DiscordGuild[] | NextResponse> {
  if (!SNOWFLAKE_RE.test(guildId)) {
    return NextResponse.json({ error: "Invalid guild id" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = await getDiscordAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return fetchManagedGuilds(accessToken);
}

/** Returns null if OK, otherwise a NextResponse 400/401/403. */
export async function assertCanManageGuild(guildId: string): Promise<NextResponse | null> {
  const loaded = await loadManagedGuilds(guildId);
  if (loaded instanceof NextResponse) return loaded;
  if (!loaded.some((g) => g.id === guildId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Returns null if the session user owns the guild, otherwise a NextResponse 401/403. */
export async function assertIsGuildOwner(guildId: string): Promise<NextResponse | null> {
  const loaded = await loadManagedGuilds(guildId);
  if (loaded instanceof NextResponse) return loaded;
  const guild = loaded.find((g) => g.id === guildId);
  if (!guild?.owner) {
    return NextResponse.json({ error: "Guild owner required" }, { status: 403 });
  }
  return null;
}

/** For server components / pages — redirect-friendly boolean. */
export async function canManageGuild(guildId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  const accessToken = await getDiscordAccessToken();
  if (!accessToken) return false;
  const guilds = await fetchManagedGuilds(accessToken);
  return guilds.some((g) => g.id === guildId);
}
