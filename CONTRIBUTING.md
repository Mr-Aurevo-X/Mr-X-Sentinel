# Contribuer à Mr-X Sentinel

Merci de ton intérêt ! Quelques règles simples.

## Prérequis

- Node.js 20 ou 22 LTS, pnpm 9.15+, Docker (Postgres, Redis, Lavalink).
- Voir le [README](README.md) pour l'installation complète.

## Workflow

1. Fork + branche depuis `main` (`feat/...`, `fix/...`).
2. `pnpm install`, puis développe.
3. Avant d'ouvrir une PR :

```bash
pnpm verify   # typecheck + lint + tests + build
```

4. Ouvre une PR claire : quoi, pourquoi, comment tester.

## Règles de code

- TypeScript strict, imports en tête de fichier, pas de `any` gratuit.
- Pas de secrets, de tokens ni d'IDs personnels dans le code, les tests ou la doc.
- Textes utilisateur du bot en français (cohérence avec l'existant).
- Un changement de schéma Prisma = une migration dans `packages/database/prisma/migrations`.

## Sécurité

Pour une faille : voir [SECURITY.md](SECURITY.md) — pas d'issue publique.
