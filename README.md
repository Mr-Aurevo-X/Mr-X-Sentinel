# Mr-X Sentinel

Plateforme Discord unifiée : sécurité, modération, logs, économie, XP, tickets, IA et musique — un seul bot, modules activables par serveur.

**Dépôt :** https://github.com/Mr-Aurevo-X/Mr-X-Sentinel

**Prérequis :** Node.js 20+ · pnpm 9.15+ · Docker Desktop (PostgreSQL, Redis, Lavalink)

---

## Sommaire

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

---

## Fonctionnalités

| Module | Description | Activation |
|--------|-------------|------------|
| **Sécurité** | Anti-nuke, anti-raid, automod, lockdown, snapshots | `/config feature` (modules par défaut on) |
| **Modération** | Slash dédiés + `/panel` interactif (boutons) + `/nuke` (clone salon) | `moderation` (défaut: on) |
| **Logs** | 12 types, catégorie **Logs Sentinel**, rôle **Logs** | `/setup create_logs:true` ou `/logs create` |
| **Communauté** | XP (embed level-up, streak), welcome/goodbye, polls, giveaways, reaction roles | `community`, `levels` |
| **Économie** | Portefeuille, banque, **$**, daily/weekly/monthly, hub `/eco`, catalogue `/buy` + boutique rôles `/shop` | `economy` |
| **Fun** | Coinflip, slots, roulette, **blackjack interactif** + hubs `/gamble` `/minijeux` (boutons) | `fun` |
| **Tickets** | Panneau, ouverture, claim, fermeture | `tickets` |
| **Templates** | 14 structures de serveur (rôles + salons) | `/setup template:…` |
| **IA** | `/chat` (Groq par défaut) | `ai` + `OPENAI_API_KEY` |
| **Musique** | `/play` + contrôles (Lavalink) | `music` + Docker Lavalink |
| **Brain** | Anti-spam / toxicité (API Python) | `brain` + `docker compose up -d brain` |

Hub membre : **`/sentinel menu`** ou **`/eco`** (navigation boutons, embeds premium).

Monnaie affichée : **`12 500 $`** (voir [`docs/UI_STYLE_GUIDE.md`](docs/UI_STYLE_GUIDE.md)).  
Parité legacy : [`docs/LEGACY_FEATURE_MATRIX.md`](docs/LEGACY_FEATURE_MATRIX.md).

---

## Prérequis

1. **Node.js 20+** — https://nodejs.org/
2. **pnpm 9.15+** — `corepack enable` puis `corepack prepare pnpm@9.15.0 --activate`, ou `npm i -g pnpm`
3. **Docker Desktop** (Windows/macOS/Linux) — https://docs.docker.com/desktop/
4. **Application Discord** — [Developer Portal](https://discord.com/developers/applications/1507473175498457129)
5. **Clé Groq** (optionnel, pour `/chat`) — https://console.groq.com

### Intents du bot (à activer dans le Portal → Bot)

- Presence Intent  
- Server Members Intent  
- Message Content Intent  
- **Guild Message Reactions** (giveaways 🎉, reaction roles)

### Invitation (permissions administrateur)

```
https://discord.com/api/oauth2/authorize?client_id=1507473175498457129&permissions=8&scope=bot%20applications.commands
```

---

## Emplacement des dépôts (disque local)

| Dépôt | Chemin typique |
|--------|----------------|
| **Mr-X Sentinel** (ce projet) | `C:\Users\aurel\Desktop\Dev\Mr-X-Sentinel` |
| Bots legacy (référence Shadow / Bot / Ult) | `C:\Users\aurel\Desktop\Dev\BOT DISCORD\` |

Ouvre le dossier **Mr-X-Sentinel** comme racine Cursor/VS Code (pas l’ancien `Desktop\BOT DISCORD` seul).

Après un déplacement de dossier : `pnpm install` puis `pnpm db:generate` (régénère le client Prisma).

---

## Installation

### Windows (PowerShell)

```powershell
cd C:\Users\aurel\Desktop\Dev\Mr-X-Sentinel
Copy-Item .env.example .env
# Éditer .env — voir section Configuration

pnpm install
docker compose up -d
pnpm db:generate
pnpm db:push
pnpm --filter @sentinel/bot deploy-commands
pnpm dev:bot
```

### Linux / macOS

```bash
cd Mr-X-Sentinel
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:push
pnpm --filter @sentinel/bot deploy-commands
pnpm dev:bot
```

> Le fichier **`.env` n’est pas sur GitHub** (secrets). Il est ignoré par git — créez-le depuis `.env.example` à la **racine** du projet (`Mr-X-Sentinel/.env`). Les commandes `pnpm db:*` chargent ce fichier automatiquement.

---

## Configuration `.env`

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DISCORD_TOKEN` | **Oui** (bot) | Portal → Bot → Token |
| `DISCORD_CLIENT_ID` | Oui | `1507473175498457129` (déjà dans l’exemple) |
| `DISCORD_CLIENT_SECRET` | Dashboard | Portal → OAuth2 → Client Secret |
| `BOT_OWNER_ID` | **Oui** pour `/owner` | Votre ID Discord (commandes bot-owner) |
| `SHARD_COUNT` | Non | Laisser vide (sharding inutile sur petits serveurs) |
| `DATABASE_URL` | Oui | `postgresql://mrx:mrx@localhost:5433/sentinel` (Docker, port **5433** évite conflit avec Postgres Windows) |
| `REDIS_URL` | Oui | `redis://localhost:6379` |
| `NEXTAUTH_SECRET` | Dashboard | Chaîne aléatoire 32+ caractères |
| `NEXTAUTH_URL` | Dashboard | `http://localhost:3000` |
| `OPENAI_API_KEY` | IA | Clé Groq `gsk_...` |
| `OPENAI_BASE_URL` | IA | `https://api.groq.com/openai/v1` (défaut projet) |
| `AI_MODEL` | IA | ex. `llama-3.3-70b-versatile` |
| `LAVALINK_HOST` | Musique | `localhost` |
| `LAVALINK_PORT` | Musique | `2333` |
| `LAVALINK_PASSWORD` | Musique | `youshallnotpass` (voir `lavalink/application.yml`) |
| `BRAIN_URL` | Non | `http://127.0.0.1:8765` |
| `BRAIN_API_KEY` | Non | Clé locale Brain |
| `BRAIN_ENABLED` | Non | `true` / `false` |
| `LOG_LEVEL` | Non | `info` |

**Dashboard OAuth2** — dans le Portal → OAuth2 → Redirects, ajouter :

```
http://localhost:3000/api/auth/callback/discord
```

---

## Démarrage

| Commande | Description |
|----------|-------------|
| `pnpm dev:bot` | Bot Discord seul |
| `pnpm dev:dashboard` | Panel web http://localhost:3000 |
| `pnpm dev` | Bot + dashboard + worker (nécessite Docker) |
| `pnpm docker:up` | Démarre Postgres, Redis, Lavalink |
| `pnpm docker:down` | Arrête les conteneurs |
| `pnpm db:push` | Applique le schéma Prisma |
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
5. **`/admin shop_add`** — boutique **rôles serveur** (optionnel ; distinct du catalogue `/buy`).
6. **`/config welcome_panel`** ou **`/config welcome`** — salons bienvenue / départ / rôle auto.
7. **`/setlevelchannel`** — salon des annonces level-up (embed premium).
8. **`/config feature`** — activer/désactiver `community`, `economy`, `levels`, `tickets`, `music`, `ai`.

---

## Commandes

### Hub et aide

| Commande | Description |
|----------|-------------|
| `/sentinel menu` | Hub : daily, travail, XP, casino, ticket |
| `/help` | Aide générale |
| `/panel` | Panneau staff **interactif** (warn, mute, kick, ban, nuke…) |

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
| `/backup restore` | Planifier une restauration |
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
| `/eco` | Hub économie (boutons Accueil, Banque, Inventaire, Shop, Info) |
| `/balance` | Solde embed (poche + banque + statut richesse) |
| `/daily` `/weekly` `/monthly` `/work` | Récompenses et travail |
| `/pay` | Payer un membre |
| `/rob` | Braquage (cooldown par victime, bouclier item) |
| `/crime` | Crime (cooldown 2h) |
| `/deposit` | Déposer en banque |
| `/withdraw` | Retirer de la banque |
| `/buy` | Acheter un objet du **catalogue global** (15 items Shadow) |
| `/use` | Utiliser un objet inventaire |
| `/leaderboard` | Classement **Économie · Niveaux · Global** (onglets + pagination) |
| `/shop list` | Catalogue global + articles boutique rôles du serveur |
| `/shop buy` | Acheter un **rôle serveur** (`item_id` affiché dans `/shop list`) |

> **Deux boutiques :** `/buy` = catalogue fixe (pizza, shield, PC…) · `/shop` = articles créés par le staff avec `/admin shop_add`.

### Fun (casino)

| Commande | Description |
|----------|-------------|
| `/gamble` | Hub casino (**boutons** : pile/face, slots, roulette, blackjack) |
| `/minijeux` | Hub mini-jeux (**boutons** : RPS, dé, devine) |
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

### Communauté

| Commande | Description |
|----------|-------------|
| `/rank` | Niveau XP (embed + barre de progression) |
| `/lvl_info` | Guide du système de niveaux (streak, commandes) |
| `/setlevelchannel` | [Owner] Salon annonces level-up (embed premium) |
| `/removelevelchannel` | [Owner] Retirer le salon level-up |
| `/levelsinfo` | [Owner] Voir la config niveaux actuelle |
| `/suggest` | Envoyer une suggestion (embed) |
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

### IA, musique, Brain

| Commande | Description |
|----------|-------------|
| `/chat message` | Discuter avec l’IA (Groq) |
| `/chat reset` | Réinitialiser la conversation |
| `/play` | Lire de la musique (salon vocal requis) |
| `/brain status` | État du service Mr-X Brain |

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

12 types enregistrés dans la catégorie **Logs Sentinel** :

`join_leave` · `message` · `moderation` · `tickets` · `automod` · `security` · `brain` · `economy` · `levels` · `music` · `ai` · `admin`

Salons nommés `logs-<type>` (ex. `logs-moderation`). Rôle **Logs** créé automatiquement.

---

## Architecture

Monorepo **pnpm** : le bot Discord consomme `@sentinel/core` (logique métier) et `@sentinel/database` (Prisma). Le dashboard web est une app Next.js séparée sur la même base Postgres.

```
Mr-X-Sentinel/
├── apps/
│   ├── bot/                    # Processus Discord (discord.js)
│   │   └── src/
│   │       ├── commands/       # Slash : definitions, permissions, handlers/
│   │       ├── interaction-router.ts  # Boutons, selects, modals
│   │       ├── client.ts       # Intents, listeners, modules core
│   │       ├── views/          # UI Discord (panels, hubs)
│   │       ├── ui/embeds.ts    # Charte embeds
│   │       ├── services/       # Level-up, blackjack, community listeners…
│   │       ├── music/          # Lavalink / Kazagumo
│   │       ├── worker.ts       # File restore (BullMQ / Redis)
│   │       └── index.ts | shard.ts
│   └── dashboard/              # Next.js 15 (App Router)
│       ├── app/                # Pages + routes API (config, lockdown, restore)
│       ├── components/         # GuildDashboard, Nav…
│       └── lib/                # Auth NextAuth
├── packages/
│   ├── shared/                 # Zod config, features, customId, UI tokens
│   ├── database/               # Prisma schema + client Postgres
│   ├── core/                   # Métier : anti-nuke/raid, automod, économie, XP,
│   │                           # tickets, templates (presets JSON), logs, brain client
│   └── ai/                     # Client Groq/OpenAI pour /chat
├── services/
│   └── brain/                  # API Python anti-spam / toxicité (Docker)
├── tools/
│   ├── migrate-legacy-sqlite.ts
│   └── migrate-ult-postgres.ts # Import Ult → Sentinel
├── docs/                       # LEGACY_FEATURE_MATRIX, UI_STYLE_GUIDE
├── lavalink/                   # application.yml Lavalink v4
├── .github/workflows/          # CI (build:ci)
└── docker-compose.yml          # Postgres, Redis, Lavalink, brain
```

**Flux interaction bot :** slash → `commands/index.ts` (`assertSlashAccess`) → handler → `@sentinel/core` · composant → `interaction-router.ts` (`assertComponentAccess` + anticheat économie).

**Scripts racine utiles :**

| Script | Rôle |
|--------|------|
| `pnpm build` | Build récursif des packages |
| `pnpm run build:ci` | Build ordonné (comme GitHub Actions) |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests `@sentinel/core` |
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
2. `pnpm install` puis `pnpm db:push` sur la base **Sentinel**.
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
| `pnpm db:push` échoue | `docker compose up -d` ; utiliser le port **5433** dans `DATABASE_URL` (conflit si Postgres Windows tourne sur 5432) |
| Bot ne démarre pas | Vérifier `DISCORD_TOKEN` et `DATABASE_URL` dans `.env` |
| Slash commands absentes | `pnpm --filter @sentinel/bot deploy-commands` |
| Giveaways / reaction roles inactifs | Activer **Guild Message Reactions** dans le Portal Discord |
| `/owner` refusé | Renseigner `BOT_OWNER_ID` dans `.env` (votre ID utilisateur) |
| `/chat` ne répond pas | Renseigner `OPENAI_API_KEY` (Groq), redémarrer le bot |
| `/play` ne marche pas | Être en vocal ; Lavalink up (`docker compose ps`) |
| Dashboard login impossible | `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`, redirect OAuth |
| Brain hors ligne | Normal si le service Python n’est pas lancé ; optionnel |

---

## Développement et CI

```bash
pnpm verify          # typecheck + lint + test + build:ci
pnpm verify:smoke    # slash commands, presets, ping DB/Redis
pnpm test:integration
```

Voir [`docs/TESTING.md`](docs/TESTING.md). CI : [`/.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Déploiement VPS

```bash
cp .env.production.example .env
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Guides : [`docs/DEPLOY_VPS.md`](docs/DEPLOY_VPS.md) · [`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/SHARDING.md`](docs/SHARDING.md).

---

## Licence

Projet privé — usage selon les conditions du dépôt [Mr-Aurevo-X/Mr-X-Sentinel](https://github.com/Mr-Aurevo-X/Mr-X-Sentinel).
