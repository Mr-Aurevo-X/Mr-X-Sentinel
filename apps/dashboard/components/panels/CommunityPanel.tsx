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

type PollRow = {
  id: string;
  question: string;
  channelId: string;
  endsAt: string | null;
  ended: boolean;
};

type GiveawayRow = {
  id: string;
  prize: string;
  winners: number;
  channelId: string;
  endsAt: string;
  ended: boolean;
};

export function CommunityPanel({
  guildId,
  initialConfig,
  polls,
  giveaways,
}: {
  guildId: string;
  initialConfig: GuildConfig;
  polls: PollRow[];
  giveaways: GiveawayRow[];
}) {
  const { config, setConfig, saving, message, save } = useGuildConfig(guildId, initialConfig);
  const resources = useDiscordResources(guildId);

  return (
    <>
      <p className="hero-kicker">Communauté</p>
      <h1>Welcome, vérif, starboard</h1>
      <Guide
        who="Le panel choisit les salons et rôles. Le bot envoie welcome, pose les rôles, gère starboard et compteur. Sondages / giveaways se créent en slash."
        how={
          <>
            Sauvegarde chaque carte. Pour le bouton vérif : <code>/verify panel</code>. Sondages :{" "}
            <code>/poll</code>. Giveaways : <code>/giveaway</code>.
          </>
        }
      >
        Accueil, vérification, salons spéciaux. Les listes en bas sont en lecture — on ne lance pas un
        giveaway depuis le web.
      </Guide>
      <Flash text={message} />
      <div className="grid grid-2">
        <Tile
          title="Arrivées"
          help="Message automatique quand quelqu’un rejoint ou part. L’auto-rôle est donné tout de suite — attention si tu as aussi la vérif."
          staticTile
        >
          <Field
            label="Salon bienvenue"
            hint="Laisse vide pour ne rien poster. Le bot écrit dans ce salon à chaque join."
          >
            <ChannelSelect
              resources={resources}
              value={config.welcome.welcomeChannelId}
              onChange={(id) => setConfig({ ...config, welcome: { ...config.welcome, welcomeChannelId: id } })}
            />
          </Field>
          <Field label="Salon départ" hint="Message de leave. Souvent le même que bienvenue, ou un salon logs.">
            <ChannelSelect
              resources={resources}
              value={config.welcome.goodbyeChannelId}
              onChange={(id) => setConfig({ ...config, welcome: { ...config.welcome, goodbyeChannelId: id } })}
            />
          </Field>
          <Field
            label="Auto-rôle"
            hint="Rôle donné à l’arrivée. Si la vérif est on, préfère le rôle « non vérifié » plutôt qu’un rôle membre."
          >
            <RoleSelect
              guildId={guildId}
              resources={resources}
              value={config.welcome.autoRoleId}
              onChange={(id) =>
                setConfig({ ...config, welcome: { ...config.welcome, autoRoleId: typeof id === "string" ? id : null } })
              }
            />
          </Field>
          <button className="btn" disabled={saving} onClick={() => void save({ welcome: config.welcome })}>
            Sauvegarder welcome
          </button>
        </Tile>
        <Tile
          title="Vérification"
          help="Le membre clique un bouton, perd le rôle non vérifié, gagne le rôle vérifié. Le message bouton se publie avec /verify panel — pas depuis ici."
          staticTile
        >
          <Toggle
            checked={config.verification.enabled}
            label="Activée"
            hint="Off = plus de gate. Les gens déjà vérifiés gardent leur rôle."
            onChange={(next) => setConfig({ ...config, verification: { ...config.verification, enabled: next } })}
          />
          <Field
            label="Salon du bouton"
            hint="Salon où /verify panel poste le message. Doit être visible des non-vérifiés."
          >
            <ChannelSelect
              resources={resources}
              value={config.verification.channelId}
              onChange={(id) => setConfig({ ...config, verification: { ...config.verification, channelId: id } })}
            />
          </Field>
          <Field
            label="Rôle vérifié"
            hint="Rôle membre « normal » après le clic. C’est lui qui ouvre les salons."
          >
            <RoleSelect
              guildId={guildId}
              resources={resources}
              value={config.verification.verifiedRoleId}
              onChange={(id) =>
                setConfig({
                  ...config,
                  verification: { ...config.verification, verifiedRoleId: typeof id === "string" ? id : null },
                })
              }
            />
          </Field>
          <Field
            label="Rôle non vérifié"
            hint="Rôle d’arrivée (anti-raid peut le poser). Doit voir le salon bouton, pas le reste du serveur."
          >
            <RoleSelect
              guildId={guildId}
              resources={resources}
              value={config.verification.unverifiedRoleId}
              onChange={(id) =>
                setConfig({
                  ...config,
                  verification: { ...config.verification, unverifiedRoleId: typeof id === "string" ? id : null },
                })
              }
            />
          </Field>
          <button className="btn" disabled={saving} onClick={() => void save({ verification: config.verification })}>
            Sauvegarder vérif
          </button>
          <p className="cta">
            Publier le bouton : <code>/verify panel</code>
          </p>
        </Tile>
        <Tile
          title="Starboard"
          help="Quand un message atteint N ⭐, le bot le recopie dans le salon starboard. Lecture communautaire, pas de modo."
          staticTile
        >
          <Toggle
            checked={config.starboard.enabled}
            label="Activé"
            hint="Off = plus de copies. Les messages déjà postés restent."
            onChange={(next) => setConfig({ ...config, starboard: { ...config.starboard, enabled: next } })}
          />
          <Field label="Salon" hint="Salon dédié, souvent #starboard. Le bot doit pouvoir y écrire.">
            <ChannelSelect
              resources={resources}
              value={config.starboard.channelId}
              onChange={(id) => setConfig({ ...config, starboard: { ...config.starboard, channelId: id } })}
            />
          </Field>
          <Field label="Seuil ⭐" hint="Nombre d’étoiles avant copie. 3–5 pour un serveur actif, 1 pour tester.">
            <input
              type="number"
              value={config.starboard.threshold}
              onChange={(e) =>
                setConfig({
                  ...config,
                  starboard: { ...config.starboard, threshold: parseInt(e.target.value, 10) || 1 },
                })
              }
            />
          </Field>
          <button className="btn" disabled={saving} onClick={() => void save({ starboard: config.starboard })}>
            Sauvegarder starboard
          </button>
        </Tile>
        <Tile
          title="Salons spéciaux"
          help="Un salon = une mécanique. Vide = désactivé. Le compteur membres renomme un salon vocal avec {count}."
          staticTile
        >
          <Field
            label="Hub temp VC"
            hint="Salon vocal « + Créer ». En rejoignant, le bot crée un salon perso puis le supprime à la sortie."
          >
            <ChannelSelect
              resources={resources}
              kinds="voice"
              value={config.tempVoice.hubChannelId}
              onChange={(id) => setConfig({ ...config, tempVoice: { hubChannelId: id } })}
            />
          </Field>
          <Field
            label="Compteur"
            hint="Salon counting : 1, 2, 3… Un seul message = le bon nombre, pas deux fois d’affilée par la même personne."
          >
            <ChannelSelect
              resources={resources}
              value={config.counting.channelId}
              onChange={(id) => setConfig({ ...config, counting: { ...config.counting, channelId: id } })}
            />
          </Field>
          <p className="muted">High score : {config.counting.highScore}</p>
          <Field
            label="Anniversaires"
            hint="Salon où le bot souhaite les anniversaires enregistrés via les commandes communauté."
          >
            <ChannelSelect
              resources={resources}
              value={config.birthday.channelId}
              onChange={(id) => setConfig({ ...config, birthday: { ...config.birthday, channelId: id } })}
            />
          </Field>
          <Field
            label="Salon spam"
            hint="Le bot y relaie un aperçu des messages d’ailleurs (modération visuelle). Laisse vide pour couper."
          >
            <ChannelSelect
              resources={resources}
              value={config.channels.spamChannelId}
              onChange={(id) => setConfig({ ...config, channels: { ...config.channels, spamChannelId: id } })}
            />
          </Field>
          <Field
            label="Salon compteur membres"
            hint="Salon vocal (souvent) dont le nom devient « Membres: 1234 ». Discord rate-limit le rename."
          >
            <ChannelSelect
              resources={resources}
              kinds="voice"
              value={config.channels.counterChannelId}
              onChange={(id) => setConfig({ ...config, channels: { ...config.channels, counterChannelId: id } })}
            />
          </Field>
          <Field
            label="Template compteur"
            hint="Texte du nom. {count} est remplacé par l’effectif. Max 100 caractères (limite Discord)."
          >
            <input
              value={config.channels.counterTemplate}
              onChange={(e) => setConfig({ ...config, channels: { ...config.channels, counterTemplate: e.target.value } })}
            />
          </Field>
          <button
            className="btn"
            disabled={saving}
            onClick={() =>
              void save({
                tempVoice: config.tempVoice,
                counting: config.counting,
                birthday: config.birthday,
                channels: config.channels,
              })
            }
          >
            Sauvegarder salons
          </button>
        </Tile>
      </div>
      <div className="grid grid-2" style={{ marginTop: "1rem" }}>
        <Tile
          title="Sondages"
          help="Lecture seule. Créer / clôturer : /poll dans Discord. Ici tu vois ce qui tourne."
          staticTile
        >
          {polls.length === 0 ? <EmptyState>Aucun sondage — /poll create</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.id}>
                  <td>{poll.question}</td>
                  <td>{poll.ended ? "terminé" : poll.endsAt ? new Date(poll.endsAt).toLocaleString("fr") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
        <Tile
          title="Giveaways"
          help="Lecture seule. Lancer un tirage : /giveaway create. Le bot tire les gagnants à l’heure de fin."
          staticTile
        >
          {giveaways.length === 0 ? <EmptyState>Aucun giveaway — /giveaway create</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>Prix</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              {giveaways.map((row) => (
                <tr key={row.id}>
                  <td>{row.prize}</td>
                  <td>{row.ended ? "terminé" : new Date(row.endsAt).toLocaleString("fr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
      </div>
    </>
  );
}
