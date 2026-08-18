import type { ReactNode } from "react";

export function Tile({
  title,
  help,
  children,
  danger = false,
  live = false,
  staticTile = false,
}: {
  title?: string;
  help?: string;
  children: ReactNode;
  danger?: boolean;
  live?: boolean;
  staticTile?: boolean;
}) {
  const mods = [
    "tile",
    danger ? "tile--danger" : "",
    live ? "tile--live" : "",
    staticTile ? "tile--static" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={mods}>
      {title ? <h2>{title}</h2> : null}
      {help ? <p className="tile-help">{help}</p> : null}
      {children}
    </section>
  );
}
