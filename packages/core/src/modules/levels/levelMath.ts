const ROLE_NAMES_10S = [
  "Bronze Pulse", "Fer Nova", "Cendre Vive", "Echo Rouge", "Pixel Brut",
  "Quartz Urbain", "Néo Rookie", "Impact 10", "Flash Basalte", "Aura Mineure",
];

const ROLE_NAMES_100S = [
  "Titan Prime", "Obsidian Core", "Nova Elite", "Vortex Supra", "Phantom Rank",
  "Apex Centuria", "Ignition X", "Quantum Rise", "Void Captain", "Solar Major",
];

const ROLE_NAMES_1000S = [
  "Mythic Ascendant", "Omega Sovereign", "Astral Dominus", "Infinity Warden", "Eclipse Monarch",
  "Celestial Apex", "Prime Overlord", "Paragon Zenith", "Arcane Eternal", "Nebula Regent",
];

export const ROLE_NAME_10000 = "✦ Transcendant";

/** XP cumulé requis pour atteindre un niveau (formule legacy Shadow/Bot). */
export function xpNeededForLevel(level: number): number {
  return 100 * level * level;
}

export function calculateLevelFromXp(xp: number): number {
  let level = 0;
  while (xp >= xpNeededForLevel(level + 1)) level += 1;
  return level;
}

export function getRewardLevel(level: number): number | null {
  if (level < 10) return null;
  if (level < 100) return Math.floor(level / 10) * 10;
  if (level < 1000) return Math.floor(level / 100) * 100;
  if (level < 10000) return Math.floor(level / 1000) * 1000;
  return 10000;
}

function seededPick(seed: number, items: string[]): string {
  let s = seed;
  s = (s * 9301 + 49297) % 233280;
  return items[s % items.length]!;
}

export function getRewardRoleName(rewardLevel: number): string {
  if (rewardLevel === 10000) return ROLE_NAME_10000;
  if (rewardLevel >= 10 && rewardLevel < 100) {
    return `${seededPick(rewardLevel, ROLE_NAMES_10S)} • ${rewardLevel}`;
  }
  if (rewardLevel >= 100 && rewardLevel < 1000) {
    return `${seededPick(rewardLevel, ROLE_NAMES_100S)} • ${rewardLevel}`;
  }
  if (rewardLevel >= 1000 && rewardLevel < 10000) {
    return `${seededPick(rewardLevel, ROLE_NAMES_1000S)} • ${rewardLevel}`;
  }
  return `Niveau ${rewardLevel}`;
}

export function getRewardColour(rewardLevel: number): number {
  if (rewardLevel === 10000) return 0xffd740;
  let s = rewardLevel + 999;
  s = (s * 9301 + 49297) % 233280;
  const r = 32 + (s % 189);
  s = (s * 9301 + 49297) % 233280;
  const g = 32 + (s % 189);
  s = (s * 9301 + 49297) % 233280;
  const b = 32 + (s % 189);
  return (r << 16) | (g << 8) | b;
}

export function isLevelRewardRoleName(name: string): boolean {
  if (name === ROLE_NAME_10000) return true;
  const prefixes = [...ROLE_NAMES_10S, ...ROLE_NAMES_100S, ...ROLE_NAMES_1000S];
  return prefixes.some((p) => name.startsWith(`${p} •`));
}

export function getStreakMultiplier(streakDays: number): number {
  if (streakDays < 3) return 1;
  if (streakDays < 30) return 3;
  const extraSteps = Math.floor((streakDays - 30) / 30);
  return 3.5 + extraSteps * 0.5;
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(oldDay: string | null | undefined, newDay: string): number {
  if (!oldDay) return 0;
  const d1 = new Date(`${oldDay}T00:00:00Z`);
  const d2 = new Date(`${newDay}T00:00:00Z`);
  return Math.floor((d2.getTime() - d1.getTime()) / 86_400_000);
}

export function getProgress(xp: number, level: number) {
  const currentLevelXp = xpNeededForLevel(level);
  const nextLevelXp = xpNeededForLevel(level + 1);
  const needed = nextLevelXp - currentLevelXp;
  const progress = xp - currentLevelXp;
  return { currentLevelXp, nextLevelXp, needed, progress };
}
