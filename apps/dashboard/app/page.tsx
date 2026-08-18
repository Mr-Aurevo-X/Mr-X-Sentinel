import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Tile } from "@/components/ui/Tile";

const FEATURES = [
  { title: "Anti-nuke", body: "Seuils, quarantaine et lockdown automatique." },
  { title: "Automod", body: "Invites, flood, caps, URLs et liste noire." },
  { title: "Snapshots", body: "Capture et restore rôles, salons, overwrites." },
  { title: "Économie", body: "Daily, work, crime et boutique du serveur." },
  { title: "Tickets", body: "File support, catégories et rôles staff." },
  { title: "Musique", body: "Lavalink YouTube, SoundCloud, Bandcamp…" },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Nav />
      <main className="container">
        <section className="hero">
          <p className="hero-kicker">Ops Discord</p>
          <h1>Le poste de contrôle Sentinel</h1>
          <p className="muted" style={{ maxWidth: 560, fontSize: "1.05rem", lineHeight: 1.55 }}>
            Configure chaque module, surveille lockdown et snapshots, lis tickets et giveaways.
            localhost aujourd&apos;hui — le même site en HTTPS demain.
          </p>
          <div className="row" style={{ marginTop: "1.5rem" }}>
            {session ? (
              <Link href="/guilds" className="btn">
                Ouvrir le panel
              </Link>
            ) : (
              <Link href="/login" className="btn">
                Connexion Discord
              </Link>
            )}
            <Link href="/demo" className="btn btn-ghost">
              Aperçu du panel
            </Link>
          </div>
        </section>
        <div className="grid grid-3" style={{ marginTop: "1rem" }}>
          {FEATURES.map((item) => (
            <Tile key={item.title} title={item.title}>
              <p className="muted" style={{ margin: 0 }}>
                {item.body}
              </p>
            </Tile>
          ))}
        </div>
      </main>
    </>
  );
}
