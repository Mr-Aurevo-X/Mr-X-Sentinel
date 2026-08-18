"use client";

import type { GuildConfig } from "@sentinel/shared";
import { useDiscordResources } from "@/hooks/useDiscordResources";
import { useGuildConfig } from "@/hooks/useGuildConfig";
import { ChannelSelect } from "@/components/ChannelSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Flash } from "@/components/ui/Flash";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";

export function LogsPanel({
  guildId,
  initialConfig,
  logChannels,
  events,
}: {
  guildId: string;
  initialConfig: GuildConfig;
  logChannels: { logType: string; channelId: string }[];
  events: { id: string; type: string; severity: string; actorId: string | null; createdAt: string }[];
}) {
  const { config, setConfig, saving, message, save } = useGuildConfig(guildId, initialConfig);
  const resources = useDiscordResources(guildId);

  return (
    <>
      <p className="hero-kicker">Observabilité</p>
      <h1>Logs</h1>
      <Guide
        who="Le bot écrit les embeds. Toi tu dis où. /logs create fabrique les salons typés (modo, sécurité, automod…)."
        how={
          <>
            Choisis un salon fallback + un webhook pour le critique, Sauvegarder, puis{" "}
            <code>/logs create</code> dans Discord pour les salons dédiés.
          </>
        }
      >
        Journal Discord : sanctions, sécurité, automod. Les événements en bas sont en lecture — pas un
        chat live.
      </Guide>
      <Flash text={message} />
      <Tile
        title="Canaux"
        help="Le salon mod-log reçoit modo + sécurité s’il n’y a pas de salon typé. Le webhook n’est appelé que pour un événement sécurité CRITICAL."
        staticTile
      >
        <Field
          label="Salon mod-log"
          hint="Fallback si /logs create n’a pas encore provisionné un salon « moderation » / « security »."
        >
          <ChannelSelect
            resources={resources}
            value={config.modLogChannelId}
            onChange={(id) => setConfig({ ...config, modLogChannelId: id })}
          />
        </Field>
        <Field
          label="Webhook alertes (URL)"
          hint="Webhook Discord (un autre salon, ou un serveur staff). Uniquement les alertes CRITICAL sécurité — pas tout le journal."
        >
          <input
            value={config.alertWebhookUrl ?? ""}
            onChange={(e) => setConfig({ ...config, alertWebhookUrl: e.target.value || null })}
            placeholder="https://discord.com/api/webhooks/…"
          />
        </Field>
        <button
          className="btn"
          disabled={saving}
          onClick={() => void save({ modLogChannelId: config.modLogChannelId, alertWebhookUrl: config.alertWebhookUrl })}
        >
          Sauvegarder logs
        </button>
        <p className="cta">
          Créer les salons : <code>/logs create</code>
        </p>
      </Tile>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title="Salons provisionnés"
          help="Créés par /logs create. Un type = un salon (automod, join_leave, tickets…). Lecture seule ici."
          staticTile
        >
          {logChannels.length === 0 ? <EmptyState>Aucun salon logs — /logs create</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Salon</th>
              </tr>
            </thead>
            <tbody>
              {logChannels.map((row) => (
                <tr key={row.logType}>
                  <td>{row.logType}</td>
                  <td>
                    <code>{row.channelId}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title="Événements sécurité"
          help="Historique anti-nuke / raid / automod / perms dangereuses. Sévérité : faible → critique. On n’efface pas depuis le panel."
          staticTile
        >
          {events.length === 0 ? <EmptyState>Aucun événement récent.</EmptyState> : null}
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
              {events.map((row) => (
                <tr key={row.id}>
                  <td>{row.type}</td>
                  <td>{row.severity}</td>
                  <td>{row.actorId ?? "—"}</td>
                  <td>{new Date(row.createdAt).toLocaleString("fr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
      </div>
    </>
  );
}
