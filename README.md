# Mr-X Sentinel

Plateforme Discord unifiée : sécurité, modération, logs, économie, XP, tickets et musique — un seul bot, modules activables par serveur.

**Dépôt :** https://github.com/Mr-Aurevo-X/Mr-X-Sentinel

**Prérequis :** Node.js **20 ou 22 LTS** (pas 24+) · pnpm 9.15+ · Docker Desktop (PostgreSQL, Redis, Lavalink)

## Hébergement local (recommandé)

Sentinel est open source : tu clones, tu crées **ton** application Discord, tu renseignes **ton** `.env`, tu lances Docker (Postgres, Redis, Lavalink) puis le bot et le dashboard sur **ta** machine (`http://localhost:3000`).

L’auteur n’héberge pas ton instance. Il n’y a pas de bot officiel à inviter.

Pour un hébergement local avec dashboard (style VPS chez soi) : **[FakeVPS](https://github.com/Mr-Aurevo-X/FakeVPS)** — outil local de Mr-Aurevo-X (cockpit `http://127.0.0.1:8787`). Tu y attaches Sentinel comme n’importe quel bot.

Guide optionnel si tu déploies toi-même (ton VPS ou FakeVPS) : [`docs/DEPLOY_VPS.md`](docs/DEPLOY_VPS.md). Ce n’est pas le produit Sentinel.

- Invitation : remplace `YOUR_CLIENT_ID` par l’ID de **ton** appli (jamais celle de l’auteur).
- Redirect OAuth : **ton** URL. En local : `http://localhost:3000/api/auth/callback/discord`.
- `.env` jamais commité ; seul `.env.example` est versionné.
- Musique / Lavalink : à tes risques (sources, quotas, conditions des plateformes).
- Licence Apache-2.0 : logiciel fourni tel quel (AS IS), sans garantie. L’auteur ne collecte aucune donnée des instances d’autrui.

---

## Sommaire

- [Hébergement local](#hébergement-local-recommandé)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration `.env`](#configuration-env)
- [Démarrage](#démarrage)
- [Premier usage sur Discord](#premier-usage-sur-discord)
- [Commandes](#commandes)
- [Templates serveur](#templates-serveur)
- [Logs](#logs)
- [Architecture](#architecture)
- [Dépannage](#dépannage)
- [Développement et CI](#développement-et-ci)
- [Déploiement optionnel](#déploiement-optionnel-ton-vps-ou-fakevps)

---

## Fonctionnalités

| Module | Description | Activation |
|--------|-------------|------------|
| **Sécurité** | Anti-nuke, anti-raid, automod, lockdown, snapshots | `/config feature` (modules par défaut on) |
| **Modération** | Slash dédiés + `/panel` interactif (boutons) + `/nuke` (clone salon) | `moderation` (défaut: on) |
| **Logs** | 10 types actifs, catégorie **Logs Sentinel**, rôle **Logs** | `/setup create_logs:true` ou `/logs create` |
| **Communauté** | XP (embed level-up, streak), welcome/goodbye, polls, giveaways, reaction roles | `community`, `levels` |
| **Économie** | Portefeuille, banque, **$**, daily/weekly/monthly, catalogue `/shop catalog` + boutique rôles `/shop` | `economy` |
| **Fun** | Coinflip, slots, roulette, **blackjack interactif** via `/fun` + hubs casino/mini-jeux (boutons du `/sentinel menu`) | `fun` |
| **Tickets** | Panneau, ouverture, claim, fermeture | `tickets` |
| **Templates** | 14 structures de serveur (rôles + salons) | `/setup template:…` |
| **Musique** | `/music play` + contrôles (Lavalink) | `music` + Docker Lavalink |

Hub membre : **`/sentinel menu`** (navigation boutons, embeds premium — économie, casino, mini-jeux).

Monnaie affichée : **`12 500 $`** (voir [`docs/UI_STYLE_GUIDE.md`](docs/UI_STYLE_GUIDE.md)).  
Parité legacy : [`docs/LEGACY_FEATURE_MATRIX.md`](docs/LEGACY_FEATURE_MATRIX.md).

---

## Prérequis

1. **Node.js 20 ou 22 LTS** — https://nodejs.org/ (CI et Docker utilisent Node 20 ; Node 24+ casse `better-sqlite3` / scripts natifs)
2. **pnpm 9.15+** — `npm i -g pnpm@9` (recommandé). Alternative : `corepack enable` puis `corepack prepare pnpm@9.15.0 --activate` — Corepack fonctionne seulement sur Node ≤ 24 (retiré de Node 25+)
3. **Docker Desktop** (Windows/macOS/Linux) — https://docs.docker.com/desktop/
4. **Application Discord** — crée la tienne sur le [Developer Portal](https://discord.com/developers/applications)

### Intents du bot (à activer dans le Portal → Bot)

- Server Members Intent  
- Message Content Intent  
- **Guild Message Reactions** (giveaways 🎉, reaction roles)

### Invitation (permissions administrateur)

Remplace `YOUR_CLIENT_ID` par l’ID de **ton** application Discord. Il n’y a pas de bot officiel à inviter.

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

---

## Installation

Chemin recommandé : clone + Docker sur ta machine. Pour un nœud local « comme un VPS chez soi » (dashboard) : **[FakeVPS](https://github.com/Mr-Aurevo-X/FakeVPS)**. Ouvre le dossier cloné comme racine de ton éditeur. Après un déplacement de dossier : `pnpm install` puis `pnpm db:generate`.

> ⚠️ Remplis le `.env` **avant** `docker compose up -d` : `docker-compose.yml` refuse de démarrer si `LAVALINK_PASSWORD` est vide.

### Windows (PowerShell)

```powershell
cd Mr-X-Sentinel
Copy-Item .env.example .env
# Éditer .env — voir section Configuration

pnpm install
docker compose up -d
pnpm db:generate
pnpm build
pnpm db:migrate
pnpm --filter @sentinel/bot deploy-commands
pnpm dev:bot
```

### Linux / macOS

```bash
cd Mr-X-Sentinel
cp .env.example .env
# Éditer .env — voir section Configuration
pnpm install
docker compose up -d
pnpm db:generate
pnpm build
pnpm db:migrate
pnpm --filter @sentinel/bot deploy-commands
pnpm dev:bot
```

> `pnpm db:migrate` applique les migrations versionnées (`prisma migrate deploy`) ; `pnpm db:push` sert uniquement au prototypage rapide, sans historique de migrations.

> `pnpm build` est indispensable au premier lancement : les packages internes (`@sentinel/shared`, `core`, `database`) sont consommés depuis `dist/`, qui n’est pas versionné.

> Le fichier **`.env` n’est pas sur GitHub** (secrets). Il est ignoré par git — créez-le depuis `.env.example` à la **racine** du projet (`Mr-X-Sentinel/.env`). Les commandes `pnpm db:*` chargent ce fichier automatiquement.

---

## Configuration `.env`

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DISCORD_TOKEN` | **Oui** (bot) | Portal → Bot → Token |
| `DISCORD_CLIENT_ID` | Oui | `YOUR_CLIENT_ID` — ID de **ton** appli Discord |
| `DISCORD_CLIENT_SECRET` | Dashboard | Portal → OAuth2 → Client Secret |
| `BOT_OWNER_ID` | **Oui** pour `/owner` | Votre ID Discord (commandes bot-owner) |
| `SHARD_COUNT` | Non | Laisser vide (sharding inutile sur petits serveurs) |
| `DATABASE_URL` | Oui | `postgresql://mrx:mrx@localhost:5433/sentinel` (Docker, port **5433** évite conflit avec Postgres Windows) |
| `REDIS_URL` | Oui | `redis://localhost:6379` |
| `NEXTAUTH_SECRET` | Dashboard | Chaîne aléatoire 32+ caractères |
| `NEXTAUTH_URL` | Dashboard | `http://localhost:3000` (prod : `https://ton-domaine`) |
| `LAVALINK_HOST` | Musique | `127.0.0.1` |
| `LAVALINK_PORT` | Musique | `2333` |
| `LAVALINK_PASSWORD` | Musique | **requis** (pas de défaut) |
| `LOG_LEVEL` | Non | `info` |

**Dashboard OAuth2** — dans le Portal → OAuth2 → Redirects, ajouter :

```
http://localhost:3000/api/auth/callback/discord
```

En HTTPS (même app, pas un second site) :

```
https://ton-domaine/api/auth/callback/discord
```

Checklist prod : `NEXTAUTH_URL=https://ton-domaine` · cookies `Secure` automatiques · reverse proxy (Caddy/nginx) vers le port 3000 · `DISCORD_TOKEN` reste côté serveur (sélecteurs salon/rôle en GET only).

Le panel (`/guilds/[id]`) couvre toute la config : sécurité, automod, communauté, économie/boutique, niveaux, tickets, logs, snapshots. Ban/kick/warn restent sur Discord. Publier un panneau (verify, tickets, logs) : slash commands.

---

## Démarrage

| Commande | Description |
|----------|-------------|
| `pnpm dev:bot` | Bot Discord seul |
| `pnpm dev:dashboard` | Panel web http://localhost:3000 |
| `pnpm dev` | Bot + dashboard + worker (nécessite Docker) |
| `pnpm docker:up` | Démarre Postgres, Redis, Lavalink |
| `pnpm docker:down` | Arrête les conteneurs |
| `pnpm db:migrate` | Applique les migrations Prisma versionnées |
| `pnpm --filter @sentinel/bot deploy-commands` | Enregistre les slash commands |

**Services Docker** ([docker-compose.yml](docker-compose.yml)) :

| Service | Port | Rôle |
|---------|------|------|
| `postgres` | **5433** (hôte) → 5432 (conteneur) | Base `sentinel` (user/pass `mrx`) |
| `redis` | 6379 | Files, lockdown, restore |
| `lavalink` | 2333 | Lecture musique |

---

## Premier usage sur Discord

1. Inviter le bot avec le [lien d’invitation](#invitation-permissions-administrateur).
2. **`/setup`** — `create_logs:true` pour créer les salons de logs ; option `template:gaming` (voir [Templates](#templates-serveur)).
3. **`/fonctionnement`** — guide interactif (réservé au **propriétaire** du serveur).
4. **`/ticket setup`** — choisir le salon du panneau tickets (+ rôle support optionnel).
5. **`/admin shop_add`** — boutique **rôles serveur** (optionnel ; distinct du catalogue `/shop catalog`).
6. **`/config welcome_panel`** ou **`/config welcome`** — salons bienvenue / départ / rôle auto.
7. **`/levels channel`** — salon des annonces level-up (embed premium).
8. **`/config feature`** — activer/désactiver `community`, `economy`, `levels`, `tickets`, `music`, `fun`.

---

## Commandes

### Hub et aide

| Commande | Description |
|----------|-------------|
| `/sentinel menu` | Hub : daily, travail, XP, casino, mini-jeux, ticket |
| `/sentinel about` | À propos du bot (licence, liens) |
| `/help` | Aide générale (onglets par tier) |
| `/panel` | Panneau staff **interactif** (warn, mute, kick, ban, nuke…) |
| `/ping` `/botinfo` `/userinfo` `/serverinfo` `/avatar` | Infos bot / membre / serveur |

### Propriétaire / administration

| Commande | Description |
|----------|-------------|
| `/setup` | Config initiale, logs, template serveur |
| `/fonctionnement` | Guide complet (owner) |
| `/logs panel` | Panneau des types de logs |
| `/logs create` | Créer tous les salons de logs |
| `/config view` | Voir les modules activés |
| `/config feature` | Activer/désactiver un module |
| `/config welcome` | Salons bienvenue / départ / rôle auto |
| `/config welcome_panel` | Panneau création salons welcome (catégorie COMMUNAUTÉ) |
| `/config economy` | Réglages économie (daily/work min-max) |
| `/template panel` | Panneau templates (appliquer / reset complet) |
| `/admin announce` | Annonce embed dans un salon |
| `/admin shop_add` | Boutique **serveur** — article + rôle (`item_id` pour `/shop buy`) |
| `/admin shop_remove` | Retirer un article boutique serveur |
| `/backup create` | Snapshot du serveur |
| `/backup list` | Lister les snapshots |
| `/backup restore` | Planifier une restauration (rôles, catégories, salons, overwrites, emojis — pas les bans ni les messages) |
| `/security status` | État sécurité / lockdown |
| `/security lockdown` | Activer le lockdown |
| `/security unlock` | Désactiver le lockdown |

### Modération (slash dédiés)

| Commande | Description |
|----------|-------------|
| `/ban` | Bannir un membre |
| `/unban` | Débannir par ID |
| `/softban` | Ban + unban immédiat (purge messages) |
| `/kick` | Expulser |
| `/mute` | Timeout (minutes) |
| `/unmute` | Retirer le mute |
| `/warn` | Avertissement |
| `/warnings` | Voir les warns |
| `/clear` | Supprimer des messages (1–100) |
| `/nuke` | Recréer le salon (clone → delete, confirmation) |
| `/clearwarn` | Effacer les warns d’un membre |
| `/nickname` | Changer le pseudo |

### Économie et boutique

| Commande | Description |
|----------|-------------|
| `/balance` | Solde embed (poche + banque + statut richesse) |
| `/daily` `/weekly` `/monthly` `/work` | Récompenses et travail |
| `/pay` | Payer un membre |
| `/rob` | Braquage (cooldown par victime, bouclier item) |
| `/crime` | Crime (cooldown 2h) |
| `/deposit` | Déposer en banque |
| `/withdraw` | Retirer de la banque |
| `/use` | Utiliser un objet inventaire |
| `/leaderboard` | Classement **Économie · Niveaux · Global** (onglets + pagination) |
| `/shop list` | Catalogue global + articles boutique rôles du serveur |
| `/shop catalog` | Acheter un objet du **catalogue global** (15 items Shadow) |
| `/shop buy` | Acheter un **rôle serveur** (`item_id` affiché dans `/shop list`) |

> **Deux boutiques :** `/shop catalog` = catalogue fixe (pizza, shield, PC…) · `/shop buy` = articles créés par le staff avec `/admin shop_add`. Le hub économie (Accueil, Banque, Inventaire) est accessible par boutons via `/sentinel menu`.

### Fun (casino)

Les hubs casino et mini-jeux s’ouvrent par **boutons** depuis `/sentinel menu`.

| Commande | Description |
|----------|-------------|
| `/fun coinflip` | Pile ou face (mise) |
| `/fun slots` | Machine à sous (mise) |
| `/fun roulette` | Rouge / noir / vert (mise) |
| `/fun blackjack` | Blackjack **interactif** Hit / Stand / Double (mise) |

### Tickets

| Commande | Description |
|----------|-------------|
| `/ticket open` | Ouvrir un ticket |
| `/ticket setup` | Publier le panneau (admin) |
| `/ticket claim` | Prendre en charge (staff) |
| `/ticket close` | Fermer le ticket (staff) |
| `/ticket reopen` `add` `remove` `rename` `config` | Gestion avancée (staff) |

### Communauté

| Commande | Description |
|----------|-------------|
| `/rank` | Niveau XP (embed + barre de progression) |
| `/lvl_info` | Guide du système de niveaux (streak, commandes) |
| `/levels channel` | [Owner] Salon annonces level-up (embed premium) |
| `/levels channel_off` | [Owner] Retirer le salon level-up |
| `/levels info` | [Owner] Voir la config niveaux actuelle |
| `/levels roles` | [Owner] Rôles référence pour les récompenses |
| `/suggest` | Envoyer une suggestion (embed) |
| `/afk` | Statut AFK (set / off) |
| `/reminder` | Rappel personnel en minutes |
| `/birthday` `/tempvc` `/counting` | Anniversaires, vocaux temporaires, comptage |
| `/starboard` `/verify` | Starboard et vérification des membres (admin/owner) |
| `/addcommand` `/removecommand` `/listcommands` | Commandes perso du serveur |
| `/poll create` | Créer un sondage (2–4 options, durée optionnelle) |
| `/poll list` | Lister les sondages du serveur |
| `/giveaway create` | Lancer un giveaway (réagir 🎉 pour participer) |
| `/giveaway end` | Terminer un giveaway par ID |
| `/giveaway list` | Giveaways actifs |
| `/reactionrole add` | Lier emoji → rôle sur un message |
| `/reactionrole remove` | Retirer une reaction role |
| `/reactionrole list` | Lister les reaction roles |

### Bot owner (`BOT_OWNER_ID` dans `.env`)

| Commande | Description |
|----------|-------------|
| `/owner balance` | Modifier cash / banque d’un membre |
| `/owner xp` | Modifier XP et niveau d’un membre |

### Musique

| Commande | Description |
|----------|-------------|
| `/music play` | Lire de la musique (titre ou lien YouTube / SoundCloud / Bandcamp / Twitch / Vimeo / Nico) |
| `/music pause` `skip` `stop` `queue` `nowplaying` `volume` `loop` `seek` `shuffle` `247` | Contrôles de lecture |

---

## Templates serveur

Option **`/setup template:`** — applique rôles, catégories et salons :

| Valeur | Nom affiché |
|--------|-------------|
| `community` | Community |
| `gaming` | Gaming |
| `support` | Support |
| `creator` | Creator |
| `business` | Business |
| `school` | School |
| `esport` | Esport |
| `development` | Development |
| `fivem` | FiveM |
| `music` | Music |
| `anime` | Anime |
| `roleplay` | Roleplay |
| `minimal` | Minimal |
| `staff-heavy` | Staff heavy |

Les logs ne sont pas recréés par le template ; utilisez `create_logs:true` sur `/setup` si besoin.

---

## Logs

10 types provisionnés dans la catégorie **Logs Sentinel** :

`join_leave` · `message` · `moderation` · `tickets` · `automod` · `security` · `economy` · `levels` · `music` · `admin`

Salons nommés `logs-<type>` (ex. `logs-moderation`). Rôle **Logs** créé automatiquement.

---

## Architecture

Monorepo **pnpm** : le bot Discord consomme `@sentinel/core` (logique métier) et `@sentinel/database` (Prisma). Le dashboard web est une app Next.js séparée sur la même base Postgres.

```
Mr-X-Sentinel/
├── apps/
│   ├── bot/                    # Processus Discord (discord.js)
│   │   └── src/
│   │       ├── commands/       # Slash : registry, definitions/, permissions, handlers/
│   │       ├── interaction-router.ts  # Dispatch composants
│   │       ├── interactions/   # Handlers boutons par domaine (mod, ticket, hub, logs)
│   │       ├── client.ts       # Intents, listeners, modules core
│   │       ├── views/          # UI Discord (panels, hubs)
│   │       ├── ui/embeds.ts    # Charte embeds
│   │       ├── services/       # Level-up, blackjack, community listeners…
│   │       ├── music/          # Lavalink / Kazagumo
│   │       ├── worker.ts       # File restore (BullMQ / Redis)
│   │       └── index.ts | shard.ts
│   └── dashboard/              # Next.js 15 — site public + panel tuiles
│       ├── app/                # Landing, /guilds, API config/jobs/lecture
│       ├── components/         # Nav, panels, sélecteurs salon/rôle
│       └── lib/                # Auth NextAuth, chargeurs guild
├── packages/
│   ├── shared/                 # Zod config, features, customId, UI tokens
│   ├── database/               # Prisma schema + client Postgres
│   ├── core/                   # Métier : anti-nuke/raid, automod, économie, XP,
│   │                           # tickets, templates (presets JSON), logs
├── tools/
│   ├── migrate-legacy-sqlite.ts
│   └── migrate-ult-postgres.ts # Import Ult → Sentinel
├── docs/                       # LEGACY_FEATURE_MATRIX, UI_STYLE_GUIDE
├── lavalink/                   # application.yml Lavalink v4
├── .github/workflows/          # CI (build:ci)
└── docker-compose.yml          # Postgres, Redis, Lavalink
```

**Flux interaction bot :** slash → `commands/index.ts` (`assertSlashAccess`) → `commands/registry.ts` → `withCommand` → handler · composant → `interaction-router.ts` (`assertComponentAccess` + anticheat économie).

**Scripts racine utiles :**

| Script | Rôle |
|--------|------|
| `pnpm build` | Build récursif des packages |
| `pnpm run build:ci` | Build ordonné (comme GitHub Actions) |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests `@sentinel/database`, `@sentinel/core` et `@sentinel/shared` |
| `pnpm migrate:legacy` | Migration depuis anciens bots SQLite |
| `pnpm migrate:ult` | Migration **Mr-X-Ult** (PostgreSQL) → Sentinel |

---

## Slash uniquement & permissions

- **Pas de préfixe `!`** — toutes les commandes sont des **slash commands** (`/`).
- Tiers runtime : **public** · **mod** · **admin** · **propriétaire serveur** · **bot owner** (`BOT_OWNER_ID`).
- `/owner` est masqué dans Discord (`default_member_permissions = 0`) mais vérifie `BOT_OWNER_ID` côté bot.
- Rôles niveaux auto : variables optionnelles `REFERENCE_ROLE_ID` et `BOT_ROLE_ID` (ou `/levels roles` par serveur).

---

## Migration depuis Mr-X-Ult (PostgreSQL)

1. Copier l’URL Postgres Ult (lecture seule recommandée).
2. `pnpm install` puis `pnpm db:migrate` sur la base **Sentinel**.
3. Dry-run :  
   `pnpm migrate:ult -- --source-url=postgresql://USER:PASS@HOST:5432/ult_db --guild-id=VOTRE_GUILD_ID --dry-run`
4. Import réel (sans `--dry-run`) pour le même `--guild-id`.
5. Redéployer les commandes : `pnpm --filter @sentinel/bot deploy-commands`

Données migrées : config guild (`guild_configs`), wallets/XP (`users`), warns (`warnings`). Starboard historique et rappels passés restent hors scope.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `docker` non reconnu | Installer **Docker Desktop**, le lancer, redémarrer PowerShell |
| Fichier `.env` invisible | Cursor : Ctrl+P → `.env` ; Windows : afficher les fichiers masqués |
| `pnpm db:migrate` échoue | `docker compose up -d` ; utiliser le port **5433** dans `DATABASE_URL` (conflit si Postgres Windows tourne sur 5432) |
| Bot ne démarre pas | Vérifier `DISCORD_TOKEN` et `DATABASE_URL` dans `.env` |
| Slash commands absentes | `pnpm --filter @sentinel/bot deploy-commands` |
| Giveaways / reaction roles inactifs | Activer **Guild Message Reactions** dans le Portal Discord |
| `/owner` refusé | Renseigner `BOT_OWNER_ID` dans `.env` (votre ID utilisateur) |
| `/music play` ne marche pas | Être en vocal ; Lavalink up (`docker compose ps`) |
| Dashboard login impossible | `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`, redirect OAuth |

---

## Développement et CI

```bash
pnpm verify          # typecheck + lint + test + build:ci
pnpm verify:smoke    # slash commands, presets, ping DB/Redis
pnpm test:integration
```

Voir [`docs/TESTING.md`](docs/TESTING.md). CI : [`/.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Déploiement optionnel (ton VPS ou FakeVPS)

Ce n’est pas le produit Sentinel. L’auteur n’héberge pas d’instance publique. Tu peux déployer la même stack sur **ton** VPS, ou la répéter dans **[FakeVPS](https://github.com/Mr-Aurevo-X/FakeVPS)** (hébergement local style VPS, cockpit dashboard).

```bash
cp .env.production.example .env
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Guides : [`docs/DEPLOY_VPS.md`](docs/DEPLOY_VPS.md) · [`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/SHARDING.md`](docs/SHARDING.md).

---

## Licence

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). Logiciel fourni « tel quel » (AS IS), sans garantie. L’auteur n’héberge pas d’instance officielle et ne collecte aucune donnée provenant des instances d’autrui.
