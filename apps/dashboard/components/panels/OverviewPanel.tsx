"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  visibleGuildFeatures,
  type GuildConfig,
  type GuildFeatures,
  type GuildStatsPayload,
} from "@sentinel/shared";
import { useGuildConfig } from "@/hooks/useGuildConfig";
import { Flash } from "@/components/ui/Flash";
import { StatusOrb } from "@/components/ui/StatusOrb";
import { Tile } from "@/components/ui/Tile";
import { Toggle } from "@/components/ui/Toggle";
import { Field } from "@/components/ui/Field";
import { Guide } from "@/components/ui/Guide";
import { FEATURE_HELP } from "@/lib/panel-help";
import { Sparkline } from "@/components/charts/Sparkline";
import { DATA } from "@/components/charts/ChartTheme";

export function OverviewPanel({
  guildId,
  initialConfig,
  lockdown,
}: {
  guildId: string;
  initialConfig: GuildConfig;
  lockdown: boolean;
}) {
  const { config, setConfig, saving, message, setMessage, save } = useGuildConfig(guildId, initialConfig);
  const [stats, setStats] = useState<GuildStatsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/guilds/${guildId}/stats?range=7d`)
      .then(async (res) => (res.ok ? ((await res.json()) as GuildStatsPayload) : null))
      .then((payload) => {
        if (cancelled) return;
        setStats(payload && !payload.empty ? payload : null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  async function toggleLockdown() {
    const res = await fetch(`/api/guilds/${guildId}/lockdown`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !lockdown }),
    });
    setMessage(
      res.ok
        ? lockdown
          ? "Unlock en file — rafraîchis dans quelques secondes."
          : "Lockdown en file — rafraîchis dans quelques secondes."
        : "Erreur lockdown.",
    );
  }

  return (
    <>
      <p className="hero-kicker">Serveur</p>
      <h1>Vue d&apos;ensemble</h1>
      <Guide
        who="Toi configures. Le worker Discord applique le lockdown. Analytics lit des compteurs horaires, jamais le texte des messages."
        how="Change une option, puis Sauvegarder. Lockdown : attends quelques secondes et rafraîchis — le badge ne bouge pas en live."
      >
        Point d&apos;entrée du serveur : lockdown, langue du bot, et interrupteurs de modules. Un module off
        arrête ses commandes et listeners, pas le reste du bot.
      </Guide>
      <Flash text={message} />
      {stats ? (
        <div className="spark-row">
          <Tile title="Messages · 7 j" help="Volume de messages non-bot sur 7 jours." staticTile>
            <p className="kpi-value">
              {stats.kpis.find((kpi) => kpi.id === "messages")?.value.toLocaleString("fr-FR") ?? "0"}
            </p>
            <Sparkline data={stats.series} dataKey="messages" color={DATA.messages} />
          </Tile>
          <Tile title="Arrivées · 7 j" help="Joins Discord (pas le solde joins−leaves)." staticTile>
            <p className="kpi-value">
              {stats.series.reduce((total, point) => total + point.joins, 0).toLocaleString("fr-FR")}
            </p>
            <Sparkline data={stats.series} dataKey="joins" color={DATA.joins} />
          </Tile>
          <Tile title="Automod · 7 j" help="Messages qui ont déclenché au moins une règle." staticTile>
            <p className="kpi-value">
              {stats.kpis.find((kpi) => kpi.id === "automodHits")?.value.toLocaleString("fr-FR") ?? "0"}
            </p>
            <Sparkline data={stats.series} dataKey="automodHits" color={DATA.automod} />
          </Tile>
        </div>
      ) : null}
      <p className="cta">
        <Link href={`/guilds/${guildId}/analytics`}>Ouvrir Analytics</Link>
      </p>
      <div className="grid grid-2">
        <Tile
          title="Lockdown"
          help="Ferme @everyone (plus d’écriture) et pose un slowmode. Le worker Discord le fait en file : le badge se met à jour après un refresh. À utiliser en raid, pas au quotidien."
          live={lockdown}
          danger={lockdown}
        >
          <p className="row">
            <StatusOrb live={lockdown} />
            <span className={lockdown ? "badge badge-off" : "badge badge-on"}>
              {lockdown ? "Actif" : "Inactif"}
            </span>
          </p>
          <button
            className={lockdown ? "btn" : "btn btn-danger"}
            style={{ marginTop: "0.9rem" }}
            onClick={() => void toggleLockdown()}
          >
            {lockdown ? "Désactiver" : "Activer"}
          </button>
        </Tile>
        <Tile title="Locale" help="Langue des réponses slash et des embeds du bot sur ce serveur.">
          <Field label="Langue du serveur" hint="fr = messages en français, en = anglais. Ça ne change pas le panel.">
            <select
              value={config.locale}
              onChange={(e) => setConfig({ ...config, locale: e.target.value as "fr" | "en" })}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </Field>
          <button className="btn" disabled={saving} onClick={() => void save({ locale: config.locale })}>
            Sauvegarder
          </button>
        </Tile>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title="Modules"
          help="Chaque interrupteur allume ou éteint un lot de commandes. Sauvegarde ensuite, sinon rien n’est persisté."
          staticTile
        >
          {visibleGuildFeatures(config.features).map(([key, on]) => {
            const doc = FEATURE_HELP[key];
            return (
              <Toggle
                key={key}
                checked={on}
                label={doc?.label ?? key}
                hint={doc?.hint}
                onChange={(next) =>
                  setConfig({
                    ...config,
                    features: { ...config.features, [key as keyof GuildFeatures]: next },
                  })
                }
              />
            );
          })}
          <button className="btn" disabled={saving} onClick={() => void save({ features: config.features })}>
            Sauvegarder modules
          </button>
        </Tile>
      </div>
    </>
  );
}
