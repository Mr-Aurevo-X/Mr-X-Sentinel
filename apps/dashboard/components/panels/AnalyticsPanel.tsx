"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  STAT_RANGES,
  type GuildStatsPayload,
  type StatRange,
} from "@sentinel/shared";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";
import { RANGE_HELP } from "@/lib/panel-help";
import { AreaFlowChart } from "@/components/charts/AreaFlowChart";
import { HourHeatmap } from "@/components/charts/HourHeatmap";
import { KpiTile } from "@/components/charts/KpiTile";
import { MessageAreaChart } from "@/components/charts/MessageAreaChart";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import { StackedLoadChart } from "@/components/charts/StackedLoadChart";
import { TopChannelsBar } from "@/components/charts/TopChannelsBar";

const RANGE_LABELS: Record<StatRange, string> = {
  "24h": "24 h",
  "7d": "7 jours",
  "30d": "30 jours",
};

export function AnalyticsPanel({ guildId }: { guildId: string }) {
  const [range, setRange] = useState<StatRange>("7d");
  const [live, setLive] = useState<GuildStatsPayload | null>(null);
  const [channelNames, setChannelNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void fetch(`/api/guilds/${guildId}/stats?range=${range}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("stats");
        return (await res.json()) as GuildStatsPayload;
      })
      .then((payload) => {
        if (!cancelled) setLive(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les analytics.");
      });
    return () => {
      cancelled = true;
    };
  }, [guildId, range]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/guilds/${guildId}/discord`)
      .then(async (res) => (res.ok ? ((await res.json()) as { channels: { id: string; name: string }[] }) : null))
      .then((data) => {
        if (cancelled || !data) return;
        const names: Record<string, string> = {};
        for (const channel of data.channels) names[channel.id] = channel.name;
        setChannelNames(names);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const loading = !live && !error;
  const empty = Boolean(live?.empty);

  const topChannels = useMemo(
    () =>
      (live?.topChannels ?? []).map((row) => ({
        name: channelNames[row.channelId] ? `#${channelNames[row.channelId]}` : `#${row.channelId.slice(-4)}`,
        messages: row.messages,
      })),
    [live, channelNames],
  );

  return (
    <>
      <p className="hero-kicker">Ops</p>
      <h1>Analytics</h1>
      <Guide
        who="Le bot compte (joins, messages, automod, cas, tickets, vocal). Le panel affiche. Rien n'est écrit ici."
        how="Choisis 24 h, 7 jours ou 30 jours. Les tuiles du haut comparent à la période juste avant."
      >
        Compteurs horaires uniquement — jamais le texte des messages, jamais qui a écrit quoi. Utile pour
        voir un raid, un creux, ou si l&apos;automod est trop agressif.
      </Guide>
      <div className="range-tabs">
        {STAT_RANGES.map((value) => (
          <button
            key={value}
            type="button"
            className={range === value ? "btn" : "btn btn-ghost"}
            onClick={() => setRange(value)}
          >
            {RANGE_LABELS[value]}
          </button>
        ))}
      </div>
      <p className="field-hint" style={{ marginTop: "-0.35rem", marginBottom: "0.85rem" }}>
        {RANGE_HELP[range]}
      </p>
      {error ? <p className="flash flash-error">{error}</p> : null}
      {loading ? (
        <p className="empty">Chargement des courbes…</p>
      ) : null}
      {empty && !error ? (
        <p className="empty">Pas encore de stats — le bot doit tourner un moment sur ce serveur.</p>
      ) : null}
      {live && !empty ? (
        <>
          <div className="kpi-grid">
            {live.kpis.map((kpi) => (
              <KpiTile key={kpi.id} kpi={kpi} />
            ))}
          </div>
          <div className="grid grid-2" style={{ marginTop: "1rem" }}>
            <Tile
              title="Flux membres"
              help="Vert = arrivées, orange = départs, ligne bleue = effectif (axe de droite). Un pic orange + chute bleue = raid kick ou purge."
              staticTile
            >
              <AreaFlowChart data={live.series} />
            </Tile>
            <Tile
              title="Messages"
              help="Volume de messages non-bot. Ça monte pendant un event, ça tombe si le serveur est lock ou mort."
              staticTile
            >
              <MessageAreaChart data={live.series} />
            </Tile>
          </div>
          <div className="grid grid-2" style={{ marginTop: "1rem" }}>
            <Tile
              title="Charge modo"
              help="Jaune = hits automod, rose = cas (/warn /mute /kick /ban). Les deux empilés = charge staff."
              staticTile
            >
              <StackedLoadChart data={live.series} />
            </Tile>
            <Tile
              title="Sévérité (7 j)"
              help="Répartition des événements sécurité sur 7 jours : faible → critique. Beaucoup de critique = nuke, raid ou perms dangereuses."
              staticTile
            >
              <SeverityDonut data={live.severity} />
            </Tile>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Tile
              title="Heatmap messages (7 × 24)"
              help="Lignes = jours, colonnes = heures UTC. Plus c’est clair (cyan → jaune → rose), plus le salon parle. Sert à voir les heures chaudes."
              staticTile
            >
              <HourHeatmap cells={live.heatmap} days={live.heatmapDays} />
            </Tile>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Tile
              title="Top salons"
              help="Salons les plus actifs sur la période. IDs seulement — pas le contenu. Utile pour voir où ça parle (ou où ça spam)."
              staticTile
            >
              <TopChannelsBar data={topChannels} />
            </Tile>
          </div>
          <p className="cta">
            Retour <Link href={`/guilds/${guildId}`}>vue d&apos;ensemble</Link>
          </p>
        </>
      ) : null}
    </>
  );
}
