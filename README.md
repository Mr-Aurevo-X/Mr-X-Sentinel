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
| **Modération** | Slash dédiés (`/ban`, `/kick`, …) + `/panel` | `moderation` (défaut: on) |
| **Logs** | 12 types, catégorie **Logs Sentinel**, rôle **Logs** | `/setup create_logs:true` ou `/logs create` |
| **Communauté** | XP, arrivées/départs, messages supprimés/modifiés | `community`, `levels` |
| **Économie** | Portefeuille, banque, daily/work via hub, boutique | `economy` |
| **Fun** | Coinflip, slots, roulette + boutons hub | `fun` |
| **Tickets** | Panneau, ouverture, claim, fermeture | `tickets` |
| **Templates** | 14 structures de serveur (rôles + salons) | `/setup template:…` |
| **IA** | `/chat` (Groq par défaut) | `ai` + `OPENAI_API_KEY` |
| **Musique** | `/play` + contrôles (Lavalink) | `music` + Docker Lavalink |
| **Brain** | Anti-spam / toxicité (API Python) | `brain` + service `services/brain` |

Hub membre : **`/sentinel menu`** (daily, travail, XP, slots, ouvrir ticket).

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

### Invitation (permissions administrateur)

```
https://discord.com/api/oauth2/authorize?client_id=1507473175498457129&permissions=8&scope=bot%20applications.commands
```

---

## Installation

### Windows (PowerShell)

```powershell
cd C:\Users\aurel\Desktop\Mr-X-Sentinel
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
| `BOT_OWNER_ID` | Recommandé | Votre ID Discord |
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
5. **`/admin shop_add`** — ajouter des articles à la boutique (optionnel).
6. **`/config feature`** — activer/désactiver `community`, `economy`, `levels`, `tickets`, `music`, `ai`.

---

## Commandes

### Hub et aide

| Commande | Description |
|----------|-------------|
| `/sentinel menu` | Hub : daily, travail, XP, slots, ticket |
| `/help` | Aide générale |
| `/panel` | Panneau staff (modération, sécurité, logs) |

### Propriétaire / administration

| Commande | Description |
|----------|-------------|
| `/setup` | Config initiale, logs, template serveur |
| `/fonctionnement` | Guide complet (owner) |
| `/logs panel` | Panneau des types de logs |
| `/logs create` | Créer tous les salons de logs |
| `/config view` | Voir les modules activés |
| `/config feature` | Activer/désactiver un module |
| `/admin announce` | Annonce embed dans un salon |
| `/admin shop_add` | Ajouter un article boutique |
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
| `/kick` | Expulser |
| `/mute` | Timeout (minutes) |
| `/unmute` | Retirer le mute |
| `/warn` | Avertissement |
| `/warnings` | Voir les warns |
| `/clear` | Supprimer des messages (1–100) |
| `/nuke` | Vider un salon (confirmation) |
| `/clearwarn` | Effacer les warns d’un membre |
| `/nickname` | Changer le pseudo |

### Économie et boutique

| Commande | Description |
|----------|-------------|
| `/balance` | Solde (poche + banque) |
| `/pay` | Payer un membre |
| `/rob` | Braquage (aléatoire) |
| `/crime` | Crime (cooldown 2h) |
| `/deposit` | Déposer en banque |
| `/withdraw` | Retirer de la banque |
| `/leaderboard` | Classement coins |
| `/shop list` | Liste des articles |
| `/shop buy` | Acheter (`item_id` de la liste) |

### Fun (casino)

| Commande | Description |
|----------|-------------|
| `/fun coinflip` | Pile ou face |
| `/fun slots` | Machine à sous |
| `/fun roulette` | Rouge / noir / vert |

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
| `/rank` | Niveau et XP |
| `/suggest` | Envoyer une suggestion (embed) |

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

```
Mr-X-Sentinel/
├── apps/
│   ├── bot/              # discord.js, commandes, hub, musique
│   └── dashboard/        # Next.js 15 + NextAuth (panel web)
├── packages/
│   ├── core/             # Modules métier, logs, templates, tickets…
│   ├── database/         # Prisma + PostgreSQL
│   ├── ai/               # Client Groq/OpenAI pour /chat
│   └── shared/           # Schémas Zod, features, types de logs
├── services/
│   └── brain/            # API FastAPI ML (optionnel)
├── lavalink/             # Config Lavalink v4
└── docker-compose.yml    # Postgres, Redis, Lavalink
```

**Scripts racine utiles :**

| Script | Rôle |
|--------|------|
| `pnpm build` | Build récursif des packages |
| `pnpm run build:ci` | Build ordonné (comme GitHub Actions) |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests `@sentinel/core` |
| `pnpm migrate:legacy` | Migration depuis anciens bots SQLite |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `docker` non reconnu | Installer **Docker Desktop**, le lancer, redémarrer PowerShell |
| Fichier `.env` invisible | Cursor : Ctrl+P → `.env` ; Windows : afficher les fichiers masqués |
| `pnpm db:push` échoue | `docker compose up -d` ; utiliser le port **5433** dans `DATABASE_URL` (conflit si Postgres Windows tourne sur 5432) |
| Bot ne démarre pas | Vérifier `DISCORD_TOKEN` et `DATABASE_URL` dans `.env` |
| Slash commands absentes | `pnpm --filter @sentinel/bot deploy-commands` |
| `/chat` ne répond pas | Renseigner `OPENAI_API_KEY` (Groq), redémarrer le bot |
| `/play` ne marche pas | Être en vocal ; Lavalink up (`docker compose ps`) |
| Dashboard login impossible | `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`, redirect OAuth |
| Brain hors ligne | Normal si le service Python n’est pas lancé ; optionnel |

---

## Développement et CI

```bash
pnpm run build:ci    # Build ordonné (shared → database → ai → core → bot → dashboard)
pnpm lint
pnpm test
```

Le workflow GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) exécute `pnpm install --frozen-lockfile`, `pnpm db:generate` et `pnpm run build:ci` sur chaque push vers `main`.

---

## Licence

Projet privé — usage selon les conditions du dépôt [Mr-Aurevo-X/Mr-X-Sentinel](https://github.com/Mr-Aurevo-X/Mr-X-Sentinel).
