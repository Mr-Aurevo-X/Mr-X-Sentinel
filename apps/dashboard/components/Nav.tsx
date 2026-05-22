import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <Link href="/guilds" className="nav-brand">
        mr-x-sentinel
      </Link>
      <Link href="/guilds">Serveurs</Link>
    </nav>
  );
}
