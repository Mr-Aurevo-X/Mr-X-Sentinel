"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_HELP } from "@/lib/panel-help";

const LINKS = [
  { href: "/demo", label: "Vue d'ensemble" },
  { href: "/demo/analytics", label: "Analytics" },
  { href: "/demo/security", label: "Sécurité" },
  { href: "/demo/automod", label: "Automod" },
  { href: "/demo/community", label: "Communauté" },
  { href: "/demo/economy", label: "Économie" },
  { href: "/demo/levels", label: "Niveaux" },
  { href: "/demo/tickets", label: "Tickets" },
  { href: "/demo/logs", label: "Logs" },
  { href: "/demo/backups", label: "Sauvegardes" },
] as const;

export function DemoSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-guild">Aperçu fictif</div>
      {LINKS.map((link) => {
        const active = link.href === "/demo" ? pathname === "/demo" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            title={NAV_HELP[link.href === "/demo" ? "" : link.href.slice("/demo".length)]}
            className={`sidebar-link${active ? " active" : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </aside>
  );
}
