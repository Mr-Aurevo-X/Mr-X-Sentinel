import { CURRENCY_SYMBOL } from "./design-tokens.js";

export function formatMoney(amount: number): string {
  const n = Math.trunc(amount);
  const spaced = n.toLocaleString("fr-FR").replace(/\u202f/g, " ");
  return `${spaced} ${CURRENCY_SYMBOL}`;
}

export function formatNumber(n: number): string {
  return Math.trunc(n).toLocaleString("fr-FR").replace(/\u202f/g, " ");
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}j`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (secs || !parts.length) parts.push(`${secs}s`);
  return parts.join(" ");
}

export function progressBar(current: number, total: number, size = 16): string {
  if (total <= 0) return "🟩".repeat(size);
  const ratio = Math.max(0, Math.min(1, current / total));
  const filled = Math.round(ratio * size);
  return "🟩".repeat(filled) + "⬛".repeat(size - filled);
}

export function mlBar(ratio: number, width = 10): string {
  const r = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(r * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)} ${Math.round(r * 100)}%`;
}

export function wealthStatus(total: number): string {
  if (total < 10_000) return "Tu es pauvre.";
  if (total < 50_000) return "Pauvre, mais moins pauvre quand même.";
  if (total < 100_000) return "Un vrai entrepreneur.";
  if (total < 1_000_000) return "Bientôt millionnaire.";
  return "Un vrai millionnaire.";
}

export function rankFlair(level: number): string {
  if (level < 5) return "🌱 Nouveau venu";
  if (level < 10) return "🌿 Membre";
  if (level < 25) return "⚡ Membre actif";
  if (level < 50) return "🔥 Habitué du chat";
  if (level < 100) return "👑 Machine à XP";
  if (level < 1000) return "💠 Monstre de progression";
  if (level < 10_000) return "🪐 Entité du serveur";
  return "✨ Au-delà du possible";
}

export function medalForPlace(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}.`;
}
