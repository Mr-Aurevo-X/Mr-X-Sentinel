import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/guilds");

  return (
    <main className="container" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h1>mr-x-sentinel</h1>
      <p style={{ color: "var(--muted)", maxWidth: 520, margin: "1rem auto 2rem" }}>
        Le panneau de contrôle pour protéger vos très gros serveurs Discord — anti-nuke,
        anti-raid, automod, snapshots et modération.
      </p>
      <Link href="/login" className="btn">
        Connexion Discord
      </Link>
    </main>
  );
}
