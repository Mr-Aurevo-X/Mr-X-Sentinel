# Migration SQLite legacy (Shadow / Bot)

## Sources supportées

Le script [`tools/migrate-legacy-sqlite.ts`](../tools/migrate-legacy-sqlite.ts) détecte automatiquement les tables :

- `users`, `user_wallets`, `wallets`, `economy`

Colonnes reconnues : `user_id` / `userId`, `balance` / `cash`, `bank`, `xp`, `level`.

## Usage

```bash
pnpm db:push
pnpm migrate:legacy -- --guild-id=VOTRE_GUILD_ID --bot-db=./chemin/economy.db
pnpm migrate:legacy -- --guild-id=... --shadow-db=./chemin/shadow.db --dry-run
```

## Limitations

- Schémas SQLite très custom peuvent nécessiter d’adapter le script.
- Pas d’import starboard / tickets historiques.
- Toujours faire un `--dry-run` avant import réel.
