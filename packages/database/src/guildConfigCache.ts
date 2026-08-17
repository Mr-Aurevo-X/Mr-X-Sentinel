import type { GuildConfig } from "@sentinel/shared";

const DEFAULT_TTL_MS = 10_000;

export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs = DEFAULT_TTL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const guildConfigCache = new TtlCache<GuildConfig>(DEFAULT_TTL_MS);

type ConfigChangedListener = (guildId: string) => void | Promise<void>;
let configChangedListener: ConfigChangedListener | null = null;

export function onGuildConfigChanged(listener: ConfigChangedListener | null): void {
  configChangedListener = listener;
}

export function invalidateGuildConfigCache(guildId: string): void {
  guildConfigCache.delete(guildId);
}

export function clearGuildConfigCache(): void {
  guildConfigCache.clear();
}

export async function notifyGuildConfigChanged(guildId: string): Promise<void> {
  await configChangedListener?.(guildId);
}
