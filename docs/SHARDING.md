# Sharding Discord

## Quand activer

- Serveurs très larges ou bot présent sur de nombreux serveurs avec latence élevée.
- Variable d’environnement `SHARD_COUNT` (nombre de shards).

## Configuration

Dans `.env` :

```
SHARD_COUNT=2
```

Le point d’entrée production [`apps/bot/src/index.ts`](../apps/bot/src/index.ts) lance un manager de shards ; chaque shard exécute [`shard.ts`](../apps/bot/src/shard.ts).

## Worker BullMQ

Une seule instance **worker** suffit (restore / files Redis), quel que soit `SHARD_COUNT`.

## Ressources

Chaque shard consomme ~80–150 Mo RAM supplémentaire. Prévoir un VPS plus large si `SHARD_COUNT` > 1.
