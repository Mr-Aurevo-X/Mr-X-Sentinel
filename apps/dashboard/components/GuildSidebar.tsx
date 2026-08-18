"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_HELP } from "@/lib/panel-help";

const LINKS = [
  { href: "", label: "Vue d'ensemble" },
  { href: "/analytics", label: "Analytics" },
  { href: "/security", label: "Sécurité" },
  { href: "/automod", label: "Automod" },
  { href: "/community", label: "Communauté" },
  { href: "/economy", label: "Économie" },
  { href: "/levels", label: "Niveaux" },
  { href: "/tickets", label: "Tickets" },
  { href: "/logs", label: "Logs" },
  { href: "/backups", label: "Sauvegardes" },
] as const;

export function GuildSidebar({ guildId, guildName }: { guildId: string; guildName: string }) {
  const pathname = usePathname();
  const base = `/guilds/${guildId}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-guild">{guildName}</div>
      {LINKS.map((link) => {
        const href = `${base}${link.href}`;
        const active =
          link.href === ""
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            title={NAV_HELP[link.href]}
            className={`sidebar-link${active ? " active" : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </aside>
  );
}
