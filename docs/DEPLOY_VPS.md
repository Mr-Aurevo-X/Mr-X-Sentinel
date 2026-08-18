# Déploiement VPS — Mr-X Sentinel

Ce guide est **optionnel**. Sentinel n’est pas un service hébergé : tu clones le dépôt public et tu fais tourner **ton** instance.

- **[FakeVPS](https://github.com/Mr-Aurevo-X/FakeVPS)** : essai **local** seulement (ta machine, cockpit). Pas un hébergement recommandé, pas du 24/7.
- **Ton VPS** : machine distante que tu gères, si tu veux un bot allumé en permanence.

Ce n’est pas le produit Sentinel.

Ubuntu 22.04/24.04. **Node.js 20 ou 22 LTS** si tu lances `deploy-commands` hors Docker.

## Profils RAM

| Profil | Services | RAM indicative |
|--------|----------|----------------|
| **core** | postgres, redis, bot, worker, dashboard | 2 Go min |
| **+ music** | + lavalink | +512 Mo |

## 1. Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Ou : `bash scripts/vps-bootstrap.sh`

## 2. Configuration

```bash
cp .env.production.example .env
nano .env
```

Obligatoire : `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DISCORD_CLIENT_SECRET`, `LAVALINK_PASSWORD` (exigé par le service bot même sans le profil musique).

### OAuth dashboard (checklist)

1. [Discord Developer Portal](https://discord.com/developers/applications) → votre app.
2. OAuth2 → Redirect : `https://VOTRE_DOMAINE/api/auth/callback/discord`
3. Scopes : `identify`, `guilds`
4. Copier **Client Secret** dans `DISCORD_CLIENT_SECRET`.

## 3. Démarrage

```bash
# Core uniquement
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Avec musique
docker compose -f docker-compose.prod.yml --profile music --env-file .env up -d --build
```

## 4. Vérifications

```bash
curl -s http://localhost:3000/api/health | jq
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f bot
```

> `pnpm verify` / `pnpm verify:smoke` supposent Node + pnpm + `pnpm install` sur la machine — inutile pour un déploiement Docker pur ; lance-les plutôt sur ta machine de dev.

## 5. Slash commands

Depuis ta machine de dev (Node + pnpm + `.env` renseigné) :

```bash
pnpm --filter @sentinel/bot deploy-commands
```

Voir [`RUNBOOK.md`](RUNBOOK.md), [`SHARDING.md`](SHARDING.md), [`TESTING.md`](TESTING.md).
