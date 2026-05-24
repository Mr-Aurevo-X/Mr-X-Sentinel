/** Pure helpers for automod (testable without Discord). */

// eslint-disable-next-line no-misleading-character-class -- combining marks for zalgo detection
const ZALGO_REGEX = /[\u0300-\u036f\u0489-\u048f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/;

export const INVITE_REGEX = /discord(?:\.gg|\.com\/invite|app\.com\/invite)\/[a-zA-Z0-9]+/gi;

export function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 8) return 0;
  const upper = letters.replace(/[^A-ZÀ-ÖØ-Þ]/g, "").length;
  return upper / letters.length;
}

export function hasZalgo(text: string): boolean {
  return ZALGO_REGEX.test(text);
}

export function hasDiscordInvite(text: string): boolean {
  INVITE_REGEX.lastIndex = 0;
  return INVITE_REGEX.test(text);
}
