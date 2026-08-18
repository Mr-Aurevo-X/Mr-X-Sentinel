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
import { Toggle } from "@/components/ui/Toggle";

type XpRow = { userId: string; xp: number; level: number };

export function LevelsPanel({
  guildId,
  initialConfig,
  top,
}: {
  guildId: string;
  initialConfig: GuildConfig;
  top: XpRow[];
}) {
  const { config, setConfig, saving, message, save } = useGuildConfig(guildId, initialConfig);
  const resources = useDiscordResources(guildId);

  return (
    <>
      <p className="hero-kicker">XP</p>
      <h1>Niveaux</h1>
      <Guide
        who="Le bot donne de l’XP sur les messages (même si tu coupes les rôles). Toi tu choisis l’annonce et la hiérarchie des rôles palier."
        how="Sauvegarde. Les rôles palier sont créés tout seuls si « récompense » est on. Le top à droite est en lecture."
      >
        XP par message et rôles de palier. Couper le module Niveaux dans Vue d&apos;ensemble arrête l&apos;XP
        — pas les compteurs Analytics.
      </Guide>
      <Flash text={message} />
      <div className="grid grid-2">
        <Tile
          title="Config"
          help="Les rôles palier sont placés entre le rôle référence (en dessous) et le rôle bot (au-dessus). Sans ces deux rôles, le bot crée le palier mais ne le range pas."
          staticTile
        >
          <Toggle
            checked={config.levels.rewardRolesEnabled}
            label="Rôles de récompense"
            hint="On = le bot crée/assigne un rôle au palier. Off = XP seulement, pas de rôle."
            onChange={(next) => setConfig({ ...config, levels: { ...config.levels, rewardRolesEnabled: next } })}
          />
          <Field
            label="Salon level-up"
            hint="Où poster « X a atteint le niveau N ». Vide = pas d’annonce (ou salon par défaut côté bot)."
          >
            <ChannelSelect
              resources={resources}
              value={config.levels.levelUpChannelId}
              onChange={(id) => setConfig({ ...config, levels: { ...config.levels, levelUpChannelId: id } })}
            />
          </Field>
          <Field
            label="Rôle référence"
            hint="Plancher de hiérarchie : les rôles palier vont juste au-dessus. Souvent @everyone ou un rôle « membre »."
          >
            <RoleSelect
              guildId={guildId}
              resources={resources}
              value={config.levels.referenceRoleId}
              onChange={(id) =>
                setConfig({
                  ...config,
                  levels: { ...config.levels, referenceRoleId: typeof id === "string" ? id : null },
                })
              }
            />
          </Field>
          <Field
            label="Rôle bot"
            hint="Rôle le plus haut du bot. Les paliers restent en dessous, sinon Discord refuse le déplacement."
          >
            <RoleSelect
              guildId={guildId}
              resources={resources}
              value={config.levels.botRoleId}
              onChange={(id) =>
                setConfig({ ...config, levels: { ...config.levels, botRoleId: typeof id === "string" ? id : null } })
              }
            />
          </Field>
          <button className="btn" disabled={saving} onClick={() => void save({ levels: config.levels })}>
            Sauvegarder niveaux
          </button>
        </Tile>
        <Tile
          title="Top 15"
          help="Classement XP actuel. Lecture seule — on ne retire pas d’XP depuis le panel."
          staticTile
        >
          {top.length === 0 ? <EmptyState>Pas encore d&apos;XP.</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Niveau</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row) => (
                <tr key={row.userId}>
                  <td>{row.userId}</td>
                  <td>{row.level}</td>
                  <td>{row.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
      </div>
    </>
  );
}
