# Intégration MrXBrain — tous les bots Mr-X

## Prérequis

1. Démarrer le service : `python start.py` (port **8765** par défaut)
2. Même clé dans `.env` du bot et de Mr-X-Brain : `BRAIN_API_KEY`

## Bots connectés

| Bot | Fichier | Comportement |
|-----|---------|--------------|
| **Mr-X-Bot** | `cogs/ml_brain.py` | Tous les messages + `/brain` |
| **Mr-X-Shadow** | `cogs/ml_brain.py` | Tous les messages + `/brain` |
| **Mr-X-Ai** | `src/services/brain.ts` | Mentions / réponses au bot |
| **Mr-X-Security** | `packages/core/.../MrxBrainService.ts` | Automod (spam/tox en plus des règles) |
| **Mr-X-Ult** | `brain/MrXBrainClient.kt` | AutoMod (spam → delete, tox → warn) |

## Variables `.env` communes

```env
BRAIN_URL=http://localhost:8765
BRAIN_API_KEY=changeme
```

Optionnel : `BRAIN_ENABLED=false` (Security, Ult) pour désactiver sans retirer l’URL.

## VPS

Sur le même serveur : `BRAIN_URL=http://127.0.0.1:8765`. Ne pas exposer le port 8765 sur Internet.
