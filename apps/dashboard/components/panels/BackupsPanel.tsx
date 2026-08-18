"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/ui/Flash";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";
import { useDemoPreview } from "@/components/DemoPreview";

type SnapshotRow = { id: string; label: string; createdAt: string; sizeBytes: number };

export function BackupsPanel({
  guildId,
  snapshots,
}: {
  guildId: string;
  snapshots: SnapshotRow[];
}) {
  const preview = useDemoPreview();
  const [message, setMessage] = useState("");
  const [rows] = useState(snapshots);

  async function createSnapshot() {
    if (preview) {
      setMessage("Aperçu — rien n'est écrit.");
      return;
    }
    const res = await fetch(`/api/guilds/${guildId}/snapshots`, { method: "POST" });
    setMessage(res.ok ? "Snapshot en file d'attente." : "Erreur snapshot.");
  }

  async function restoreSnapshot(snapshotId: string) {
    if (preview) {
      setMessage("Aperçu — rien n'est écrit.");
      return;
    }
    const res = await fetch(`/api/guilds/${guildId}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId }),
    });
    setMessage(res.ok ? "Restauration en file d'attente." : "Erreur restauration.");
  }

  return (
    <>
      <p className="hero-kicker">Rollback</p>
      <h1>Snapshots</h1>
      <Guide
        who="Le panel met la capture ou la restore en file. Le worker Discord (bot) fait le travail : ça peut prendre une minute."
        how="Créer un snapshot avant un gros changement ou après un raid. Restaurer recrée rôles / catégories / salons / overwrites / emojis — pas les bans, pas les messages."
      >
        Filet de sécurité structurel. Ce n&apos;est pas un backup des discussions.
      </Guide>
      <Flash text={message} />
      <Tile
        title="Captures"
        help="Chaque ligne = une photo du serveur. Restaurer écrase la structure actuelle (nouveaux IDs, mapping). Rafraîchis la page pour voir une capture qui vient d’être créée."
        staticTile
      >
        <button className="btn" onClick={() => void createSnapshot()}>
          Créer un snapshot
        </button>
        {rows.length === 0 ? <EmptyState>Aucune capture — le worker les liste après refresh.</EmptyState> : null}
        <table style={{ marginTop: "0.8rem" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Label</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <code>{row.id.slice(0, 8)}…</code>
                </td>
                <td>{row.label}</td>
                <td>{new Date(row.createdAt).toLocaleString("fr")}</td>
                <td>
                  <button className="btn btn-ghost" onClick={() => void restoreSnapshot(row.id)}>
                    Restaurer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cta">Restaure rôles, catégories, salons, overwrites et emojis — pas les bans ni les messages.</p>
      </Tile>
    </>
  );
}
