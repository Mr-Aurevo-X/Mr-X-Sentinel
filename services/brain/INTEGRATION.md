# Intégration Brain — Mr-X-Sentinel uniquement

Brain est le sidecar ML de **Sentinel** (`services/brain`), exposé en HTTP.

## Démarrage

- Docker : `docker compose --profile brain up -d` (voir `docker-compose.yml`, build `./services/brain`)
- Ou local : `cd services/brain && python start.py` (port **8765**)

## Variables Sentinel `.env`

```env
BRAIN_URL=http://127.0.0.1:8765
BRAIN_API_KEY=changeme
BRAIN_ENABLED=true
```

En prod compose : `BRAIN_URL=http://brain:8765`.

Les anciens bots (Bot, Shadow, Ai, Security, Ult) sont retirés — seul Sentinel consomme Brain.
