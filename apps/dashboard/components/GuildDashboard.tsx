"use client";

import { useState } from "react";
import type { GuildConfig } from "@sentinel/shared";

interface Props {
  guildId: string;
  config: GuildConfig;
  lockdown: boolean;
  events: {
    id: string;
    type: string;
    severity: string;
    actorId: string | null;
    createdAt: string;
    metadata: unknown;
  }[];
  snapshots: { id: string; label: string; createdAt: string; sizeBytes: number }[];
  whitelist: { id: string; userId: string; level: string }[];
  logChannels?: { logType: string; channelId: string }[];
}

export function GuildDashboard({
  guildId,
  config: initialConfig,
  lockdown: initialLockdown,
  events,
  snapshots,
  whitelist,
  logChannels = [],
}: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [lockdown, setLockdown] = useState(initialLockdown);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveConfig(patch: Partial<GuildConfig>) {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/guilds/${guildId}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
      setMessage("Configuration sauvegardée.");
    } else {
      setMessage("Erreur lors de la sauvegarde.");
    }
    setSaving(false);
  }

  async function toggleLockdown() {
    const res = await fetch(`/api/guilds/${guildId}/lockdown`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !lockdown }),
    });
    if (res.ok) {
      const data = await res.json();
      setLockdown(data.lockdown);
      setMessage(data.lockdown ? "Lockdown activé." : "Lockdown désactivé.");
    }
  }

  async function restoreSnapshot(snapshotId: string) {
    const res = await fetch(`/api/guilds/${guildId}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId }),
    });
    setMessage(res.ok ? "Restauration en file d'attente." : "Erreur restauration.");
  }

  return (
    <div>
      <h1>Serveur {guildId}</h1>
      {message && <p style={{ color: "var(--success)" }}>{message}</p>}

      {logChannels.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h2>Salons de logs</h2>
          <ul style={{ fontSize: "0.9rem" }}>
            {logChannels.map((l) => (
              <li key={l.logType}>
                <strong>{l.logType}</strong> — <code>{l.channelId}</code>
              </li>
            ))}
          </ul>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Recréer via Discord : <code>/logs create</code> ou bouton dans{" "}
            <code>/fonctionnement</code>
          </p>
        </div>
      )}

      <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="card">
          <h2>Vue d&apos;ensemble</h2>
          <p>
            Lockdown:{" "}
            <span className={lockdown ? "badge badge-off" : "badge badge-on"}>
              {lockdown ? "ACTIF" : "Inactif"}
            </span>
          </p>
          <button
            className={lockdown ? "btn" : "btn btn-danger"}
            style={{ marginTop: "1rem" }}
            onClick={toggleLockdown}
          >
            {lockdown ? "Désactiver lockdown" : "Activer lockdown"}
          </button>
        </div>

        <div className="card">
          <h2>Modules</h2>
          <p>
            Anti-Nuke:{" "}
            <span className={config.antiNuke.enabled ? "badge badge-on" : "badge badge-off"}>
              {config.antiNuke.enabled ? "ON" : "OFF"}
            </span>
          </p>
          <p>
            Anti-Raid:{" "}
            <span className={config.antiRaid.enabled ? "badge badge-on" : "badge badge-off"}>
              {config.antiRaid.enabled ? "ON" : "OFF"}
            </span>
          </p>
          <p>
            Automod:{" "}
            <span className={config.automod.enabled ? "badge badge-on" : "badge badge-off"}>
              {config.automod.enabled ? "ON" : "OFF"}
            </span>
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Anti-Nuke</h2>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.antiNuke.enabled}
              onChange={(e) =>
                setConfig({ ...config, antiNuke: { ...config.antiNuke, enabled: e.target.checked } })
              }
            />{" "}
            Activé
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.antiNuke.monitorOnly}
              onChange={(e) =>
                setConfig({
                  ...config,
                  antiNuke: { ...config.antiNuke, monitorOnly: e.target.checked },
                })
              }
            />{" "}
            Mode surveillance uniquement
          </label>
        </div>
        <div className="form-group">
          <label>Jours de quarantaine</label>
          <input
            type="number"
            value={config.antiNuke.quarantineDays}
            onChange={(e) =>
              setConfig({
                ...config,
                antiNuke: { ...config.antiNuke, quarantineDays: parseInt(e.target.value, 10) },
              })
            }
          />
        </div>
        <button className="btn" disabled={saving} onClick={() => saveConfig({ antiNuke: config.antiNuke })}>
          Sauvegarder Anti-Nuke
        </button>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Anti-Raid</h2>
        <div className="form-group">
          <label>Limite joins / fenêtre</label>
          <input
            type="number"
            value={config.antiRaid.joinLimit}
            onChange={(e) =>
              setConfig({
                ...config,
                antiRaid: { ...config.antiRaid, joinLimit: parseInt(e.target.value, 10) },
              })
            }
          />
        </div>
        <div className="form-group">
          <label>Âge compte minimum (jours)</label>
          <input
            type="number"
            value={config.antiRaid.minAccountAgeDays}
            onChange={(e) =>
              setConfig({
                ...config,
                antiRaid: { ...config.antiRaid, minAccountAgeDays: parseInt(e.target.value, 10) },
              })
            }
          />
        </div>
        <button className="btn" disabled={saving} onClick={() => saveConfig({ antiRaid: config.antiRaid })}>
          Sauvegarder Anti-Raid
        </button>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Économie</h2>
        <div className="form-group">
          <label>Daily min / max</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="number"
              value={config.economy.dailyMin}
              onChange={(e) =>
                setConfig({
                  ...config,
                  economy: { ...config.economy, dailyMin: parseInt(e.target.value, 10) },
                })
              }
            />
            <input
              type="number"
              value={config.economy.dailyMax}
              onChange={(e) =>
                setConfig({
                  ...config,
                  economy: { ...config.economy, dailyMax: parseInt(e.target.value, 10) },
                })
              }
            />
          </div>
        </div>
        <div className="form-group">
          <label>Work min / max</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="number"
              value={config.economy.workMin}
              onChange={(e) =>
                setConfig({
                  ...config,
                  economy: { ...config.economy, workMin: parseInt(e.target.value, 10) },
                })
              }
            />
            <input
              type="number"
              value={config.economy.workMax}
              onChange={(e) =>
                setConfig({
                  ...config,
                  economy: { ...config.economy, workMax: parseInt(e.target.value, 10) },
                })
              }
            />
          </div>
        </div>
        <button className="btn" disabled={saving} onClick={() => saveConfig({ economy: config.economy })}>
          Sauvegarder économie
        </button>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Automod</h2>
        <div className="form-group">
          <label>Mentions max</label>
          <input
            type="number"
            value={config.automod.maxMentions}
            onChange={(e) =>
              setConfig({
                ...config,
                automod: { ...config.automod, maxMentions: parseInt(e.target.value, 10) },
              })
            }
          />
        </div>
        <div className="form-group">
          <label>Mots interdits (un par ligne)</label>
          <textarea
            rows={4}
            value={config.automod.wordBlacklist.join("\n")}
            onChange={(e) =>
              setConfig({
                ...config,
                automod: {
                  ...config.automod,
                  wordBlacklist: e.target.value.split("\n").filter(Boolean),
                },
              })
            }
          />
        </div>
        <button className="btn" disabled={saving} onClick={() => saveConfig({ automod: config.automod })}>
          Sauvegarder Automod
        </button>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Whitelist ({whitelist.length})</h2>
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Niveau</th>
            </tr>
          </thead>
          <tbody>
            {whitelist.map((w) => (
              <tr key={w.id}>
                <td>{w.userId}</td>
                <td>{w.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Utilisez /security whitelist-add sur Discord pour ajouter des entrées.
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Snapshots</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Label</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.id}>
                <td>
                  <code>{s.id.slice(0, 8)}…</code>
                </td>
                <td>{s.label}</td>
                <td>{new Date(s.createdAt).toLocaleString("fr")}</td>
                <td>
                  <button className="btn" onClick={() => restoreSnapshot(s.id)}>
                    Restaurer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Logs sécurité (live)</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Sévérité</th>
              <th>Acteur</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.type}</td>
                <td>{e.severity}</td>
                <td>{e.actorId ?? "—"}</td>
                <td>{new Date(e.createdAt).toLocaleString("fr")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
