import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, fetchManagedGuilds, getDiscordAccessToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";

export default async function GuildsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const accessToken = await getDiscordAccessToken();
  const guilds = accessToken ? await fetchManagedGuilds(accessToken) : [];

  return (
    <>
      <Nav />
      <main className="container">
        <h1>Vos serveurs</h1>
        <p style={{ color: "var(--muted)" }}>Sélectionnez un serveur à configurer.</p>
        <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
          {guilds.map((g) => (
            <Link key={g.id} href={`/guilds/${g.id}`} className="card">
              <strong>{g.name}</strong>
              <p style={{ color: "var(--muted)", margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                ID: {g.id}
              </p>
            </Link>
          ))}
          {guilds.length === 0 && (
            <p>Aucun serveur avec permission Manage Guild trouvé.</p>
          )}
        </div>
      </main>
    </>
  );
}
