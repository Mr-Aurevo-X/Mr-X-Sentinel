import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { GuildSidebar } from "@/components/GuildSidebar";
import { fetchManagedGuilds, getDiscordAccessToken } from "@/lib/auth";
import { requireGuildAccess } from "@/lib/guild-page";

export default async function GuildLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);
  const accessToken = await getDiscordAccessToken();
  const guilds = accessToken ? await fetchManagedGuilds(accessToken) : [];
  const guildName = guilds.find((guild) => guild.id === guildId)?.name ?? guildId;

  return (
    <>
      <Nav />
      <div className="panel-shell">
        <GuildSidebar guildId={guildId} guildName={guildName} />
        <div className="panel-main">{children}</div>
      </div>
    </>
  );
}
