import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import DiscordProvider from "next-auth/providers/discord";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { discordTokenNeedsRefresh } from "./discord-oauth";

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
  const token = await getToken({
    req: {
      headers: {
        cookie: cookieStore.toString(),
      },
    } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) return null;
  if (discordTokenNeedsRefresh(token.expiresAt)) return null;
  const access = token.accessToken;
  return typeof access === "string" && access.length > 0 ? access : null;
}

export async function fetchManagedGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const guilds = (await res.json()) as DiscordGuild[];
  const MANAGE_GUILD = 0x20n;
  return guilds.filter((g) => {
    const perms = BigInt(g.permissions);
    return g.owner || (perms & MANAGE_GUILD) === MANAGE_GUILD;
  });
}

const SNOWFLAKE_RE = /^\d{17,20}$/;

/** Returns null if OK, otherwise a NextResponse 400/401/403. */
export async function assertCanManageGuild(guildId: string): Promise<NextResponse | null> {
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
  const guilds = await fetchManagedGuilds(accessToken);
  if (!guilds.some((g) => g.id === guildId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Returns null if the session user owns the guild, otherwise a NextResponse 401/403. */
export async function assertIsGuildOwner(guildId: string): Promise<NextResponse | null> {
  const accessToken = await getDiscordAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guilds = await fetchManagedGuilds(accessToken);
  const guild = guilds.find((g) => g.id === guildId);
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
