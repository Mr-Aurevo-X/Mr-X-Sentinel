# Déploiement VPS — Mr-X Sentinel

Ubuntu 22.04/24.04. **Node.js 20 ou 22 LTS** si tu lances `deploy-commands` hors Docker.

## Profils RAM

| Profil | Services | RAM indicative |
|--------|----------|----------------|
| **core** | postgres, redis, bot, worker, dashboard | 2 Go min |
| **+ music** | + lavalink | +512 Mo |

IA / Brain (PyTorch) sont parkés dans `archive/ai-brain/` — pas de profile Compose live.

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

Obligatoire : `DISCORD_TOKEN`, `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DISCORD_CLIENT_SECRET`.

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
pnpm verify
pnpm verify:smoke
```

## 5. Slash commands

```bash
pnpm --filter @sentinel/bot deploy-commands
```

Voir [`RUNBOOK.md`](RUNBOOK.md), [`SHARDING.md`](SHARDING.md), [`TESTING.md`](TESTING.md).
