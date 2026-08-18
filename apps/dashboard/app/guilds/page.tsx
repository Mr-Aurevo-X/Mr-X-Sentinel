import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, fetchManagedGuilds, getDiscordAccessToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";
import { EmptyState } from "@/components/ui/EmptyState";

function guildIconUrl(id: string, icon: string | null): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${id}/${icon}.${ext}?size=128`;
}

export default async function GuildsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const accessToken = await getDiscordAccessToken();
  const guilds = accessToken ? await fetchManagedGuilds(accessToken) : [];

  return (
    <>
      <Nav />
      <main className="container">
        <p className="hero-kicker">Panel</p>
        <h1>Vos serveurs</h1>
        <Guide
          who="Toi, avec la permission Discord Manage Guild (ou owner). Le bot doit déjà être sur le serveur."
          how="Clique une carte. Chaque page du panel a un guide en haut (Qui / Comment) et une aide sous chaque option."
        >
          Un serveur = un panel. Tu configures ici ; le bot applique dans Discord. L&apos;aperçu public
          n&apos;écrit rien en base.
        </Guide>
        <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
          {guilds.map((g) => {
            const icon = guildIconUrl(g.id, g.icon);
            return (
              <Link key={g.id} href={`/guilds/${g.id}`} style={{ color: "inherit" }}>
                <Tile staticTile={false}>
                  <div className="row">
                    {icon ? (
                      <img className="guild-icon" src={icon} alt="" />
                    ) : (
                      <div className="guild-icon">{g.name.slice(0, 1)}</div>
                    )}
                    <div>
                      <strong>{g.name}</strong>
                      <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
                        {g.owner ? "Propriétaire" : "Manage Guild"} · {g.id}
                      </p>
                    </div>
                  </div>
                </Tile>
              </Link>
            );
          })}
        </div>
        {guilds.length === 0 ? (
          <EmptyState>Aucun serveur avec permission Manage Guild.</EmptyState>
        ) : null}
      </main>
    </>
  );
}
