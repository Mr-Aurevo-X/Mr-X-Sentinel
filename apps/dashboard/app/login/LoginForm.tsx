"use client";

import { signIn } from "next-auth/react";
import { Nav } from "@/components/Nav";
import { Tile } from "@/components/ui/Tile";

export function LoginForm({
  hint,
  ready,
}: {
  hint: string | null;
  ready: boolean;
}) {
  return (
    <>
      <Nav />
      <main className="container" style={{ maxWidth: 480, paddingTop: "4rem" }}>
        <Tile
          title="Connexion"
          help="OAuth Discord officiel. On ne voit pas ton mot de passe. Ensuite tu ne gères que les serveurs où tu as Manage Guild (ou owner)."
          staticTile
        >
          <p className="muted">Pas de compte Sentinel à part — c&apos;est ton login Discord.</p>
          {hint ? <p className="flash flash-error">{hint}</p> : null}
          <button
            className="btn"
            style={{ marginTop: "1.2rem", width: "100%" }}
            disabled={!ready}
            onClick={() => void signIn("discord", { callbackUrl: "/guilds" })}
          >
            Continuer avec Discord
          </button>
        </Tile>
      </main>
    </>
  );
}
