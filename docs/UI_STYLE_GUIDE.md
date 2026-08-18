# Mr-X Sentinel — Charte UI

## Monnaie

- Symbole : **$** uniquement
- Format : `12 500 $` (espaces milliers FR, symbole après)
- Utiliser `formatMoney()` depuis `@sentinel/shared` — jamais « coins » ou « € »

## Couleurs (embeds)

| Token | Hex | Usage |
|-------|-----|--------|
| brand | `0x5865F2` | Hub, aide, config |
| economy | `0xF1C40F` | Balance, shop, daily |
| success | `0x57F287` | Gains, succès |
| error | `0xED4245` | Erreurs, pertes |
| warning | `0xFEE75C` | Cooldowns |
| levels | `0x5865F2` | Rank, XP |
| fun | `0xE91E63` | Casino |

## Règles

1. Toute réponse utilisateur = **embed** (+ components si hub)
2. `deferReply` / `deferUpdate` avant toute I/O DB
3. Footer : `Mr-X Sentinel` + timestamp
4. Thumbnail : avatar membre (profil) ou icône serveur (classements)
5. Erreurs : embed rouge `❌ Titre`

## Emojis standards

- 👛 Portefeuille · 🏦 Banque · 📊 Total / Rank · 💰 Économie · 🎰 Casino · 🏆 Classement

## Builders

Code : `apps/bot/src/ui/embeds.ts` + `packages/shared/src/ui/formatters.ts`

## Audit complété (2026-05)

- [x] Level-up → `LevelUpAnnouncer` + `buildLevelUpEmbed`
- [x] Welcome/goodbye → `WelcomeAnnouncer` + builders embeds
- [x] Slash commands → embed via middleware
- [x] Hubs casino / minijeux → embeds + boutons
- [x] Logs modération / économie → embeds

