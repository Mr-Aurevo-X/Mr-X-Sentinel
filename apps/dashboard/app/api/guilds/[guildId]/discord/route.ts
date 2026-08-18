import { NextResponse } from "next/server";
import { assertCanManageGuild } from "@/lib/auth";
import type { DiscordChannelOption, DiscordRoleOption, DiscordResources } from "@/lib/discord-resources";

type CacheEntry = { at: number; data: DiscordResources };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60_000;

type RawChannel = { id: string; name: string; type: number; parent_id?: string | null };
type RawRole = { id: string; name: string; managed?: boolean; position?: number };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;

  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.data);
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    const empty: DiscordResources = { channels: [], roles: [], available: false };
    return NextResponse.json(empty);
  }

  const headers = { Authorization: `Bot ${token}` };
  const [chRes, roleRes] = await Promise.all([
    fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, { headers }),
    fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers }),
  ]);

  if (!chRes.ok || !roleRes.ok) {
    const empty: DiscordResources = { channels: [], roles: [], available: false };
    return NextResponse.json(empty);
  }

  const rawChannels = (await chRes.json()) as RawChannel[];
  const rawRoles = (await roleRes.json()) as RawRole[];
  const channels: DiscordChannelOption[] = rawChannels
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parentId: channel.parent_id ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const roles: DiscordRoleOption[] = rawRoles
    .map((role) => ({
      id: role.id,
      name: role.name,
      managed: Boolean(role.managed),
      position: role.position ?? 0,
    }))
    .sort((a, b) => b.position - a.position);

  const data: DiscordResources = { channels, roles, available: true };
  cache.set(guildId, { at: Date.now(), data });
  return NextResponse.json(data);
}
