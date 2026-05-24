# Migration Mr-X-Ult (PostgreSQL)

## Usage

```bash
pnpm migrate:ult -- --source-url=postgresql://USER:PASS@HOST:5432/ult_db --guild-id=GUILD_ID --dry-run
pnpm migrate:ult -- --source-url=... --guild-id=...   # import réel
```

## Données migrées

- `guild_configs` → config Sentinel (économie, automod, levels, welcome, tickets, starboard, anti-raid)
- `users` → `userWallet` + `userXp`
- `warnings` → `modCase` (type WARN)
- `mod_log_channel_id` → champ guild

## Hors scope

- Historique starboard (messages / réactions passées)
- Rappels planifiés legacy
- Données hors tables Ult listées ci-dessus

## Rapport post-migration

Le script affiche les compteurs source vs base Sentinel après import.
