"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function Nav() {
  const pathname = usePathname();
  const { data } = useSession();
  const onGuilds = pathname.startsWith("/guilds");

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        Mr-X Sentinel
      </Link>
      <Link href="/" className={pathname === "/" ? "active" : ""}>
        Accueil
      </Link>
      {data ? (
        <Link href="/guilds" className={onGuilds ? "active" : ""}>
          Serveurs
        </Link>
      ) : (
        <Link href="/login">Connexion</Link>
      )}
      <Link href="/demo" className={pathname.startsWith("/demo") ? "active" : ""}>
        Aperçu
      </Link>
      <span className="nav-spacer" />
      {data?.user?.name ? <span className="muted">{data.user.name}</span> : null}
      {data ? (
        <button className="btn btn-ghost" type="button" onClick={() => void signOut({ callbackUrl: "/" })}>
          Quitter
        </button>
      ) : null}
    </nav>
  );
}
