# Runbook — Mr-X Sentinel (production)

## Premier déploiement

1. Copier [`.env.production.example`](../.env.production.example) → `.env`.
2. Renseigner : `DISCORD_TOKEN`, `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DISCORD_CLIENT_SECRET`.
3. OAuth Discord : redirect `https://VOTRE_DOMAINE/api/auth/callback/discord`.
4. Lancer : `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`
5. Vérifier : `curl -s http://localhost:3000/api/health`
6. Slash commands : `pnpm --filter @sentinel/bot deploy-commands`

## Profils Compose

| Commande | Services |
|----------|----------|
| `docker compose -f docker-compose.prod.yml up -d` | core (postgres, redis, bot, worker, dashboard) |
| `... --profile music up -d` | + Lavalink |
| `... --profile brain up -d` | + Brain ML |

## Mise à jour

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Dépannage rapide

| Symptôme | Action |
|----------|--------|
| Dashboard 503 | Vérifier Postgres (`DATABASE_URL`), logs `dashboard` |
| Bot offline | Token Discord, intents Portal, logs `bot` |
| `/play` KO | Profile `music`, Lavalink up |
| Brain OFF | Normal si `BRAIN_ENABLED=false` ou sans profile `brain` |

## Santé

- Dashboard : `GET /api/health`
- Bot : log JSON `sentinel_boot_health` au démarrage

Voir aussi [`DEPLOY_VPS.md`](DEPLOY_VPS.md).
