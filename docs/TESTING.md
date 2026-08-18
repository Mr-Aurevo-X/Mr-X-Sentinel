# Tests — Mr-X Sentinel

## Commandes

```bash
pnpm verify              # typecheck + lint + test + build:ci
pnpm verify:smoke        # slash commands, presets JSON, DB/Redis si configurés
pnpm test:integration    # Prisma contre DATABASE_URL (CI ou local)
```

## Tests unitaires (Vitest)

| Package | Fichiers |
|---------|----------|
| `@sentinel/core` | ThreatEngine, featureGates, restore, snapshots, économie / fun |
| `@sentinel/shared` | config-schema, cookie-header, features |
| `@sentinel/bot` | ACK slash, `/dashboard`, middleware |
| `@sentinel/dashboard` | OAuth guilds, cookies |

## Intégration base de données

Nécessite Postgres accessible :

```bash
export DATABASE_URL=postgresql://mrx:mrx@localhost:5433/sentinel
pnpm db:migrate
pnpm test:integration
```

## Smoke Discord (optionnel)

Avec un bot de test et un serveur dédié :

```bash
export DISCORD_TOKEN=...
export DISCORD_GUILD_ID=...
pnpm exec tsx tools/discord-smoke.ts
```

Ne pas lancer en CI sans secrets dédiés.

## Bot de test recommandé

1. Créer une application Discord de test.
2. Inviter le bot sur un serveur vide.
3. Renseigner `DISCORD_TOKEN` et `DISCORD_GUILD_ID` pour `discord-smoke.ts`.
