"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="container" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h1>Connexion</h1>
      <p style={{ color: "var(--muted)" }}>Connectez-vous avec Discord pour gérer vos serveurs.</p>
      <button className="btn" style={{ marginTop: "1.5rem" }} onClick={() => signIn("discord")}>
        Continuer avec Discord
      </button>
    </main>
  );
}
