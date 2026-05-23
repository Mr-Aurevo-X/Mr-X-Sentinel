# Déploiement VPS — Mr-X Sentinel

Ubuntu 22.04/24.04 · 2 Go RAM min (4 Go si Brain + Lavalink).

## 1. Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
```

Ou : `bash scripts/vps-bootstrap.sh`

## 2. Configuration

```bash
git clone https://github.com/Mr-Aurevo-X/Mr-X-Sentinel.git
cd Mr-X-Sentinel
cp .env.production.example .env
nano .env
```

Obligatoire : `DISCORD_TOKEN`, `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DISCORD_CLIENT_SECRET`.

## 3. Démarrage

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
curl -s http://localhost:3000/api/health
```

## 4. Slash commands

```bash
pnpm --filter @sentinel/bot deploy-commands
```

## 5. HTTPS (Caddy)

```caddy
dashboard.example.com {
  reverse_proxy localhost:3000
}
```

OAuth redirect : `https://dashboard.example.com/api/auth/callback/discord`

## 6. Vérification

```bash
pnpm verify
DATABASE_URL=postgresql://mrx:PASS@localhost:5432/sentinel REDIS_URL=redis://localhost:6379 pnpm verify:smoke
```

## Brain (optionnel)

```bash
docker compose -f docker-compose.prod.yml --profile brain up -d brain
# BRAIN_ENABLED=true puis redémarrer bot
```

Voir [`README.md`](../README.md) pour le dépannage.
