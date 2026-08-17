# Archive — IA + Brain

Parké hors du bot actif (2026-08-16). À réintégrer plus tard.

| Dossier | Contenu |
|---------|---------|
| `packages-ai/` | Client Groq/OpenAI (`@sentinel/ai`) — `/chat`, mentions |
| `services-brain/` | API Python MrXBrain (spam / toxicité) |
| `bot-hooks/` | Accroches bot/core telles qu’elles étaient au moment du retrait |

## Remettre en service

1. `git mv archive/ai-brain/packages-ai packages/ai`
2. `git mv archive/ai-brain/services-brain services/brain`
3. Recoller les hooks (`bot-hooks/`) dans `apps/bot` et `packages/core`
4. Remettre `@sentinel/ai` dans `apps/bot/package.json` et les scripts `build:ci` / `typecheck`
5. Remettre le service `brain` dans `docker-compose.yml`
6. `pnpm install` puis `pnpm --filter @sentinel/bot deploy-commands`
