"use client";

import type { GuildConfig } from "@sentinel/shared";
import { useDiscordResources } from "@/hooks/useDiscordResources";
import { useGuildConfig } from "@/hooks/useGuildConfig";
import { ChannelSelect } from "@/components/ChannelSelect";
import { RoleSelect } from "@/components/RoleSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Flash } from "@/components/ui/Flash";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";

type TicketRow = {
  id: string;
  channelId: string;
  ownerId: string;
  claimedBy: string | null;
  status: string;
  ticketType: string;
};

export function TicketsPanel({
  guildId,
  initialConfig,
  tickets,
}: {
  guildId: string;
  initialConfig: GuildConfig;
  tickets: TicketRow[];
}) {
  const { config, setConfig, saving, message, save } = useGuildConfig(guildId, initialConfig);
  const resources = useDiscordResources(guildId);

  return (
    <>
      <p className="hero-kicker">Support</p>
      <h1>Tickets</h1>
      <Guide
        who="Toi choisis salon, catégorie et rôles support. Le membre ouvre un ticket via le bouton Discord. Le staff claim / close dans le salon."
        how={
          <>
            Sauvegarde ici, puis publie le bouton avec <code>/ticket setup</code>. Sans ça, la config ne
            sert à rien. La liste du bas est en lecture.
          </>
        }
      >
        Support privé : un salon par demande. On ne ferme pas un ticket depuis le web.
      </Guide>
      <Flash text={message} />
      <Tile
        title="Config"
        help="Le panneau = message avec bouton. La catégorie = où les salons ticket apparaissent. Les rôles support voient ces salons."
        staticTile
      >
        <Field
          label="Salon du panneau"
          hint="Salon public où /ticket setup poste le bouton « Ouvrir un ticket »."
        >
          <ChannelSelect
            resources={resources}
            value={config.tickets.panelChannelId}
            onChange={(id) => setConfig({ ...config, tickets: { ...config.tickets, panelChannelId: id } })}
          />
        </Field>
        <Field
          label="Catégorie"
          hint="Catégorie Discord (pas un salon texte). Chaque ticket devient un salon dedans."
        >
          <ChannelSelect
            resources={resources}
            kinds="category"
            value={config.tickets.categoryId}
            onChange={(id) => setConfig({ ...config, tickets: { ...config.tickets, categoryId: id } })}
          />
        </Field>
        <Field
          label="Rôles support"
          hint="Ces rôles ont accès aux tickets (voir / répondre / claim). Ils n’ont pas besoin d’être admin."
        >
          <RoleSelect
            guildId={guildId}
            resources={resources}
            multiple
            value={config.tickets.supportRoleIds}
            onChange={(next) =>
              setConfig({
                ...config,
                tickets: { ...config.tickets, supportRoleIds: Array.isArray(next) ? next : [] },
              })
            }
          />
        </Field>
        <button className="btn" disabled={saving} onClick={() => void save({ tickets: config.tickets })}>
          Sauvegarder tickets
        </button>
        <p className="cta">
          Publier le panneau : <code>/ticket setup</code>
        </p>
      </Tile>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title="Tickets ouverts / récents"
          help="File actuelle. Owner = qui a ouvert. Claim / close se font dans Discord, pas ici."
          staticTile
        >
          {tickets.length === 0 ? <EmptyState>Aucun ticket.</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>Salon</th>
                <th>Owner</th>
                <th>Statut</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((row) => (
                <tr key={row.id}>
                  <td>{row.channelId}</td>
                  <td>{row.ownerId}</td>
                  <td>{row.status}</td>
                  <td>{row.ticketType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
      </div>
    </>
  );
}
