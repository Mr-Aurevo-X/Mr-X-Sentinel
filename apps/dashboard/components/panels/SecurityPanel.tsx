"use client";

import { useState } from "react";
import type { GuildConfig } from "@sentinel/shared";
import { useDiscordResources } from "@/hooks/useDiscordResources";
import { useGuildConfig } from "@/hooks/useGuildConfig";
import { RoleSelect } from "@/components/RoleSelect";
import { Field } from "@/components/ui/Field";
import { Flash } from "@/components/ui/Flash";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";
import { Toggle } from "@/components/ui/Toggle";
import { NUKE_THRESHOLD_HELP, NUKE_THRESHOLD_LABEL } from "@/lib/panel-help";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDemoPreview } from "@/components/DemoPreview";

type CaseRow = {
  id: string;
  caseNumber: number;
  type: string;
  targetId: string;
  moderatorId: string;
  reason: string;
  active: boolean;
  createdAt: string;
};

export function SecurityPanel({
  guildId,
  initialConfig,
  whitelist,
  cases,
}: {
  guildId: string;
  initialConfig: GuildConfig;
  whitelist: { id: string; userId: string; level: string }[];
  cases: CaseRow[];
}) {
  const preview = useDemoPreview();
  const { config, setConfig, saving, message, setMessage, save } = useGuildConfig(guildId, initialConfig);
  const resources = useDiscordResources(guildId);
  const [entries, setEntries] = useState(whitelist);
  const [newUserId, setNewUserId] = useState("");
  const [newLevel, setNewLevel] = useState("TRUSTED");

  async function addWhitelist() {
    if (preview) {
      if (!newUserId.trim()) return;
      setEntries((current) => [
        ...current.filter((row) => row.userId !== newUserId),
        { id: `wl-${newUserId}`, userId: newUserId, level: newLevel },
      ]);
      setNewUserId("");
      setMessage("Aperçu — rien n'est écrit.");
      return;
    }
    const res = await fetch(`/api/guilds/${guildId}/whitelist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: newUserId, level: newLevel }),
    });
    if (!res.ok) {
      setMessage("Whitelist : ID invalide.");
      return;
    }
    const data = (await res.json()) as { entry: { id: string; userId: string; level: string } };
    setEntries((current) => [...current.filter((row) => row.userId !== data.entry.userId), data.entry]);
    setNewUserId("");
    setMessage("Whitelist mise à jour.");
  }

  async function removeWhitelist(userId: string) {
    if (preview) {
      setEntries((current) => current.filter((row) => row.userId !== userId));
      setMessage("Aperçu — rien n'est écrit.");
      return;
    }
    const res = await fetch(`/api/guilds/${guildId}/whitelist?userId=${userId}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((current) => current.filter((row) => row.userId !== userId));
      setMessage("Entrée whitelist retirée.");
    }
  }

  const thresholds = Object.entries(config.antiNuke.thresholds);

  return (
    <>
      <p className="hero-kicker">Sécurité</p>
      <h1>Anti-nuke, raid, whitelist</h1>
      <Guide
        who="Le panel enregistre les seuils. Le bot lit l’audit log et les joins. Les sanctions (ban/kick/warn) restent des commandes slash — pas ici."
        how="Sauvegarde chaque bloc. Whitelist = ID Discord (snowflake). Les cas en bas sont en lecture seule."
      >
        Protège le serveur contre un staff compromis (nuke) et contre une vague de comptes (raid). Le owner
        est toujours whitelisté.
      </Guide>
      <Flash text={message} />
      <div className="grid grid-2">
        <Tile
          title="Anti-nuke"
          help="Déclenche si quelqu’un ban, kick, crée ou modifie trop de salons/rôles d’un coup. Les whitelistés (et le owner) ne sont pas touchés."
          staticTile
        >
          <Toggle
            checked={config.antiNuke.enabled}
            label="Activé"
            hint="Off = plus de protection nuke. À laisser on en prod."
            onChange={(next) => setConfig({ ...config, antiNuke: { ...config.antiNuke, enabled: next } })}
          />
          <Toggle
            checked={config.antiNuke.monitorOnly}
            label="Surveillance uniquement"
            hint="Log et alerte seulement — pas de quarantaine ni lockdown. Utile pour tester les seuils."
            onChange={(next) => setConfig({ ...config, antiNuke: { ...config.antiNuke, monitorOnly: next } })}
          />
          <Toggle
            checked={config.antiNuke.autoLockdown}
            label="Auto-lockdown"
            hint="Si un seuil saute, le worker ferme @everyone comme le bouton Lockdown de la vue d’ensemble."
            onChange={(next) => setConfig({ ...config, antiNuke: { ...config.antiNuke, autoLockdown: next } })}
          />
          <Field
            label="Jours de quarantaine"
            hint="Durée du rôle quarantaine posé sur l’acteur. 0 ou 1 = court ; 7 = le temps d’enquêter."
          >
            <input
              type="number"
              value={config.antiNuke.quarantineDays}
              onChange={(e) =>
                setConfig({
                  ...config,
                  antiNuke: { ...config.antiNuke, quarantineDays: parseInt(e.target.value, 10) || 1 },
                })
              }
            />
          </Field>
          <Field
            label="Rôle quarantaine"
            hint="Rôle sans perms (souvent isolé). Le rôle du bot doit être au-dessus dans la hiérarchie Discord."
          >
            <RoleSelect
              guildId={guildId}
              resources={resources}
              value={config.quarantineRoleId}
              onChange={(id) => setConfig({ ...config, quarantineRoleId: typeof id === "string" ? id : null })}
            />
          </Field>
          {thresholds.map(([key, row]) => (
            <Field
              key={key}
              label={`${NUKE_THRESHOLD_LABEL[key] ?? key} (nombre / fenêtre s)`}
              hint={NUKE_THRESHOLD_HELP[key]}
            >
              <div className="row">
                <input
                  type="number"
                  value={row.count}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      antiNuke: {
                        ...config.antiNuke,
                        thresholds: {
                          ...config.antiNuke.thresholds,
                          [key]: { ...row, count: parseInt(e.target.value, 10) || 1 },
                        },
                      },
                    })
                  }
                />
                <input
                  type="number"
                  value={row.windowSec}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      antiNuke: {
                        ...config.antiNuke,
                        thresholds: {
                          ...config.antiNuke.thresholds,
                          [key]: { ...row, windowSec: parseInt(e.target.value, 10) || 1 },
                        },
                      },
                    })
                  }
                />
              </div>
            </Field>
          ))}
          <button
            className="btn"
            disabled={saving}
            onClick={() => void save({ antiNuke: config.antiNuke, quarantineRoleId: config.quarantineRoleId })}
          >
            Sauvegarder anti-nuke
          </button>
        </Tile>
        <Tile
          title="Anti-raid"
          help="Filtre les nouveaux comptes à l’arrivée. Ce n’est pas l’anti-nuke : ici on parle de joins, pas d’un modo qui détruit le serveur."
          staticTile
        >
          <Toggle
            checked={config.antiRaid.enabled}
            label="Activé"
            hint="Off = plus de filtre à l’arrivée. La vérif (Communauté) peut rester active toute seule."
            onChange={(next) => setConfig({ ...config, antiRaid: { ...config.antiRaid, enabled: next } })}
          />
          <Toggle
            checked={config.antiRaid.requireAvatar}
            label="Exiger un avatar"
            hint="Les comptes sans photo de profil sont marqués suspects (souvent des raids)."
            onChange={(next) => setConfig({ ...config, antiRaid: { ...config.antiRaid, requireAvatar: next } })}
          />
          <Toggle
            checked={config.antiRaid.autoLockdown}
            label="Auto-lockdown"
            hint="Si trop de joins dans la fenêtre, le worker lock le serveur."
            onChange={(next) => setConfig({ ...config, antiRaid: { ...config.antiRaid, autoLockdown: next } })}
          />
          <Field label="Joins max" hint="Nombre d’arrivées dans la fenêtre avant alerte / lockdown. Ex. 8.">
            <input
              type="number"
              value={config.antiRaid.joinLimit}
              onChange={(e) =>
                setConfig({
                  ...config,
                  antiRaid: { ...config.antiRaid, joinLimit: parseInt(e.target.value, 10) || 1 },
                })
              }
            />
          </Field>
          <Field label="Fenêtre (secondes)" hint="Durée du compteur de joins. Ex. 10 s avec 8 joins = vague.">
            <input
              type="number"
              value={config.antiRaid.joinWindowSec}
              onChange={(e) =>
                setConfig({
                  ...config,
                  antiRaid: { ...config.antiRaid, joinWindowSec: parseInt(e.target.value, 10) || 1 },
                })
              }
            />
          </Field>
          <Field
            label="Âge compte min (jours)"
            hint="0 = désactivé. 3 = refuse les comptes créés il y a moins de 3 jours."
          >
            <input
              type="number"
              value={config.antiRaid.minAccountAgeDays}
              onChange={(e) =>
                setConfig({
                  ...config,
                  antiRaid: { ...config.antiRaid, minAccountAgeDays: parseInt(e.target.value, 10) || 0 },
                })
              }
            />
          </Field>
          <Field
            label="Noms suspects (un motif par ligne)"
            hint="Sous-chaîne, pas une regex. Ex. discord.gg ou nitro. Comparé au nom d’utilisateur, insensible à la casse."
          >
            <textarea
              rows={3}
              value={config.antiRaid.suspiciousNamePatterns.join("\n")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  antiRaid: {
                    ...config.antiRaid,
                    suspiciousNamePatterns: e.target.value.split("\n").filter(Boolean),
                  },
                })
              }
            />
          </Field>
          <button className="btn" disabled={saving} onClick={() => void save({ antiRaid: config.antiRaid })}>
            Sauvegarder anti-raid
          </button>
        </Tile>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title="Rôles staff"
          help="Référence des rôles modo du serveur. Les commandes slash regardent encore les permissions Discord (Modérer / Ban / Kick / Gérer le serveur)."
          staticTile
        >
          <Field
            label="Rôles modération"
            hint="Coche les rôles que tu considères staff. Ça n’accorde pas de perms Discord tout seul."
          >
            <RoleSelect
              guildId={guildId}
              resources={resources}
              multiple
              value={config.staff.modRoleIds}
              onChange={(next) =>
                setConfig({
                  ...config,
                  staff: { modRoleIds: Array.isArray(next) ? next : [] },
                })
              }
            />
          </Field>
          <button className="btn" disabled={saving} onClick={() => void save({ staff: config.staff })}>
            Sauvegarder staff
          </button>
        </Tile>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title={`Whitelist (${entries.length})`}
          help="Trusted et Extra owner skip automod, anti-nuke et permission guard. Le owner du serveur est toujours whitelisté, pas besoin de l’ajouter."
          staticTile
        >
          {entries.length === 0 ? <EmptyState>Aucune entrée (le owner est toujours whitelisté).</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Niveau</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr key={row.id}>
                  <td>{row.userId}</td>
                  <td>{row.level}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => void removeWhitelist(row.userId)}>
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ marginTop: "0.8rem" }}>
            <input
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="ID Discord (snowflake)"
            />
            <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
              <option value="TRUSTED">Trusted — staff, skip filtres</option>
              <option value="EXTRA_OWNER">Extra owner — co-owner</option>
            </select>
            <button className="btn" onClick={() => void addWhitelist()}>
              Ajouter
            </button>
          </div>
          <p className="field-hint">
            ID = clic droit sur le membre → Copier l&apos;identifiant (mode développeur). Trusted = staff.
            Extra owner = co-owner — les deux skip automod et anti-nuke.
          </p>
        </Tile>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title="Cas de modération (lecture)"
          help="Journal des /warn /mute /kick /ban. On ne sanctionne pas depuis le web — trop risqué. Ouvre Discord pour agir."
          staticTile
        >
          {cases.length === 0 ? <EmptyState>Aucun cas — les sanctions se font via le bot.</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Cible</th>
                <th>Modo</th>
                <th>Raison</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((row) => (
                <tr key={row.id}>
                  <td>{row.caseNumber}</td>
                  <td>{row.type}</td>
                  <td>{row.targetId}</td>
                  <td>{row.moderatorId}</td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cta">
            Ban / kick / warn : <code>/ban</code> <code>/kick</code> <code>/warn</code>
          </p>
        </Tile>
      </div>
    </>
  );
}
