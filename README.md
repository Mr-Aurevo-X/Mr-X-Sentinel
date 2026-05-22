# Mr-X Sentinel

Plateforme Discord unifiée : sécurité, modération, logs, économie, XP, IA, musique.

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker (PostgreSQL, Redis, Lavalink)
- Application Discord : [Developer Portal](https://discord.com/developers/applications/1507473175498457129)

### Intents (Bot)

- Presence Intent
- Server Members Intent
- Message Content Intent

### Invitation

```
https://discord.com/api/oauth2/authorize?client_id=1507473175498457129&permissions=8&scope=bot%20applications.commands
```

## Installation

```bash
cd Mr-X-Sentinel
pnpm install
cp .env.example .env
# Remplir DISCORD_TOKEN, DISCORD_CLIENT_SECRET, NEXTAUTH_SECRET

docker compose up -d
pnpm db:generate
pnpm db:push

pnpm --filter @sentinel/bot deploy-commands
pnpm dev:bot
```

## Commandes principales

| Public | Staff / Owner |
|--------|----------------|
| `/sentinel menu` | `/ban` `/kick` `/mute` `/warn` … |
| `/rank` `/help` | `/panel` `/security` `/logs` |
| `/play` `/chat` | `/setup` `/fonctionnement` (owner) |

**Modération :** slash dédiés (`/ban`, `/kick`, …), pas uniquement des boutons.

**Logs :** `/setup create_logs:true` ou `/logs create` — catégorie **Logs Sentinel**, 12 salons auto.

**Owner :** `/fonctionnement` — guide complet du serveur.

## Structure

- `apps/bot` — bot Discord (sharding)
- `apps/dashboard` — panel Next.js
- `packages/core` — modules métier
- `services/brain` — API ML FastAPI

## Repo

https://github.com/Mr-Aurevo-X/Mr-X-Sentinel.git
