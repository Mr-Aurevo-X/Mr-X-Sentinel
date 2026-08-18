# Comparaison — Mr-X Sentinel vs bots populaires

Positionnement de **Mr-X Sentinel** face aux bots SaaS courants.  
Parité legacy : [`LEGACY_FEATURE_MATRIX.md`](LEGACY_FEATURE_MATRIX.md).

## Synthèse

| Critère | MEE6 | Dyno | Carl-bot | Wick | ProBot | UnbelievaBoat | **Sentinel** |
|---------|------|------|----------|------|--------|---------------|--------------|
| Hébergement | SaaS | SaaS | SaaS | SaaS | SaaS | SaaS | **Self-hosted** |
| Anti-nuke / snapshots | Limité | Limité | Non | Fort | Limité | Non | **Oui** |
| Modération + panels | Partiel | Oui | Oui | Oui | Oui | Non | **Oui** |
| Économie complète | Non | Non | Non | Non | Limité | **Fort** | **Oui** |
| XP + rôles paliers | **Fort** | Basique | Non | Non | Oui | Non | **Oui** |
| Templates serveur | Non | Non | Non | Non | Non | Non | **14 presets** |
| Musique / IA | Premium | Non | Non | Non | Oui | Non | **Lavalink + Groq** |
| Dashboard admin | Oui | Oui | Non | Non | Oui | Web | **Self-hosted** |

## Différenciateurs Sentinel+

1. Plateforme unifiée (sécurité + éco + XP + tickets).
2. Données sur **votre** Postgres.
3. ThreatEngine, lockdown, snapshots, Brain ML optionnel.
4. Migration legacy Mr-X (Ult, Shadow, Bot).
5. Vérification : `pnpm verify` + [`parity-fixtures.json`](../tools/parity-fixtures.json).

## Tests automatisés

| Fichier | Rôle |
|---------|------|
| `tools/parity-fixtures.json` | Références XP / économie |
| `levelMath.test.ts` | Formule `100 × level²` |
| `economyParity.test.ts` | Weekly 1500, monthly 5000 |

## Quand choisir quoi ?

| Besoin | Choix |
|--------|-------|
| Zéro ops, petit serveur | MEE6 / Dyno / Carl-bot |
| Anti-raid SaaS maximal | Wick |
| Économie seule | UnbelievaBoat |
| Tout-en-un + contrôle données | **Mr-X Sentinel (VPS)** |
