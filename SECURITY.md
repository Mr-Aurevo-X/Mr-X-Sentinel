# Politique de sécurité

## Versions supportées

Seule la branche `main` reçoit des correctifs de sécurité.

## Signaler une vulnérabilité

Ne crée **pas** d'issue publique pour une faille exploitable.

1. Utilise l'onglet **Security → Report a vulnerability** du dépôt GitHub (GitHub Private Vulnerability Reporting), ou
2. Contacte l'auteur en privé via GitHub ([@Mr-Aurevo-X](https://github.com/Mr-Aurevo-X)).

Inclue si possible : version/commit, étapes de reproduction, impact estimé.

Tu recevras un accusé de réception sous 7 jours. Merci de laisser un délai raisonnable
pour publier un correctif avant toute divulgation publique.

## Périmètre

- Bot Discord (`apps/bot`), dashboard (`apps/dashboard`), packages (`packages/*`).
- Les instances auto-hébergées par des tiers restent sous la responsabilité de leur opérateur :
  garde ton `.env` privé, ne partage jamais ton token de bot ni ton client secret.
