"use client";

import type { GuildConfig } from "@sentinel/shared";
import { useGuildConfig } from "@/hooks/useGuildConfig";
import { Field } from "@/components/ui/Field";
import { Flash } from "@/components/ui/Flash";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";
import { Toggle } from "@/components/ui/Toggle";

export function AutomodPanel({
  guildId,
  initialConfig,
}: {
  guildId: string;
  initialConfig: GuildConfig;
}) {
  const { config, setConfig, saving, message, save } = useGuildConfig(guildId, initialConfig);
  const automod = config.automod;

  function patch(partial: Partial<GuildConfig["automod"]>) {
    setConfig({ ...config, automod: { ...automod, ...partial } });
  }

  return (
    <>
      <p className="hero-kicker">Filtre</p>
      <h1>Automod</h1>
      <Guide
        who="Le bot lit chaque message (sauf bots et whitelistés). S’il casse une règle : suppression, timeout, log. Toi tu règles les filtres ici."
        how="Coche ce que tu veux bloquer, ajuste les seuils, Sauvegarder. Trop serré = faux positifs (regarde Analytics → Automod)."
      >
        Filtre automatique des messages. Ça n’est pas l’anti-nuke : ici on parle de spam, invites et mots, pas
        d’un staff qui détruit les salons.
      </Guide>
      <Flash text={message} />
      <Tile
        title="Règles"
        help="Une infraction = message supprimé + timeout court. Deux d’un coup = timeout plus long. Les whitelistés passent."
        staticTile
      >
        <Toggle
          checked={automod.enabled}
          label="Activé"
          hint="Interrupteur global. Off = toutes les règles ci-dessous sont ignorées."
          onChange={(next) => patch({ enabled: next })}
        />
        <Toggle
          checked={automod.blockInvites}
          label="Bloquer les invitations"
          hint="Supprime discord.gg / invitations, sauf les serveurs listés plus bas."
          onChange={(next) => patch({ blockInvites: next })}
        />
        <Toggle
          checked={automod.blockExternalUrls}
          label="Bloquer les URLs externes"
          hint="Tout lien hors discord.com / discord.gg. Utile contre le phishing, lourd si tu partages beaucoup de liens."
          onChange={(next) => patch({ blockExternalUrls: next })}
        />
        <Toggle
          checked={automod.blockEveryone}
          label="Bloquer @everyone / @here"
          hint="Même si le membre a la perm Discord, le bot coupe le message. Staff whitelisté non concerné."
          onChange={(next) => patch({ blockEveryone: next })}
        />
        <Toggle
          checked={automod.blockCaps}
          label="Bloquer le caps lock"
          hint="Déclenche si le ratio MAJUSCULES dépasse le seuil ci-dessous."
          onChange={(next) => patch({ blockCaps: next })}
        />
        <Toggle
          checked={automod.blockZalgo}
          label="Bloquer le zalgo"
          hint="Texte déformé (accents empilés) souvent utilisé pour casser le chat."
          onChange={(next) => patch({ blockZalgo: next })}
        />
        <div className="grid grid-2">
          <Field
            label="Messages / seconde"
            hint="Au-delà = flood. 3–5 est raisonnable ; 1 punit les gens qui tapent vite."
          >
            <input
              type="number"
              value={automod.maxMessagesPerSec}
              onChange={(e) => patch({ maxMessagesPerSec: parseInt(e.target.value, 10) || 1 })}
            />
          </Field>
          <Field
            label="Mentions max"
            hint="Users + rôles dans un seul message. 0 = presque tout mention est interdit."
          >
            <input
              type="number"
              value={automod.maxMentions}
              onChange={(e) => patch({ maxMentions: parseInt(e.target.value, 10) || 0 })}
            />
          </Field>
          <Field
            label="Doublons max"
            hint="Combien de fois le même texte avant sanction. 3 = on tolère un copier-coller."
          >
            <input
              type="number"
              value={automod.maxDuplicateMessages}
              onChange={(e) => patch({ maxDuplicateMessages: parseInt(e.target.value, 10) || 2 })}
            />
          </Field>
          <Field
            label="Fenêtre doublons (s)"
            hint="Durée pendant laquelle on compte les copies. 10 s = anti-spam, 60 s = plus strict."
          >
            <input
              type="number"
              value={automod.duplicateWindowSec}
              onChange={(e) => patch({ duplicateWindowSec: parseInt(e.target.value, 10) || 1 })}
            />
          </Field>
          <Field
            label="Ratio caps (0.5–1)"
            hint="0.7 = 70 % de majuscules. Plus bas = plus strict. Ignoré si « caps lock » est off."
          >
            <input
              type="number"
              step="0.05"
              value={automod.capsRatioLimit}
              onChange={(e) => patch({ capsRatioLimit: Number(e.target.value) || 0.7 })}
            />
          </Field>
          <Field
            label="Comptes neufs (heures)"
            hint="0 = désactivé. 24 = un compte créé il y a moins d’un jour ne peut pas parler."
          >
            <input
              type="number"
              value={automod.newAccountHours}
              onChange={(e) => patch({ newAccountHours: parseInt(e.target.value, 10) || 0 })}
            />
          </Field>
        </div>
        <Field
          label="Guilds d'invite autorisées (un ID par ligne)"
          hint="IDs de serveurs dont les invitations passent (partenaires, réseau). Le tien n’a pas besoin d’être listé si tu ne bloques pas tes propres invites."
        >
          <textarea
            rows={3}
            value={automod.allowedInviteGuilds.join("\n")}
            onChange={(e) => patch({ allowedInviteGuilds: e.target.value.split("\n").filter(Boolean) })}
          />
        </Field>
        <Field
          label="URLs bloquées (un hôte par ligne)"
          hint="Sous-chaîne dans l’URL, ex. bit.ly ou grabify. S’ajoute au blocage global des liens externes."
        >
          <textarea
            rows={3}
            value={automod.blockedUrls.join("\n")}
            onChange={(e) => patch({ blockedUrls: e.target.value.split("\n").filter(Boolean) })}
          />
        </Field>
        <Field
          label="Mots interdits (un par ligne)"
          hint="Sous-chaîne, insensible à la casse. « con » matchera aussi « content » — sois précis."
        >
          <textarea
            rows={4}
            value={automod.wordBlacklist.join("\n")}
            onChange={(e) => patch({ wordBlacklist: e.target.value.split("\n").filter(Boolean) })}
          />
        </Field>
        <button className="btn" disabled={saving} onClick={() => void save({ automod: config.automod })}>
          Sauvegarder automod
        </button>
      </Tile>
    </>
  );
}
