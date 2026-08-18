import { parseRestoreMode, type RestoreMode } from "@sentinel/shared";

export { parseRestoreMode, type RestoreMode };

export const GUILD_CATEGORY_TYPE = 4;

export function idsToPurge(
  currentIds: readonly string[],
  snapshotIds: readonly string[],
  protectedIds: ReadonlySet<string>,
): string[] {
  const keep = new Set(snapshotIds);
  return currentIds.filter((id) => !keep.has(id) && !protectedIds.has(id));
}

/** Live Discord ids after recreate — snapshot snowflakes are not valid keep ids. */
export function liveIdsFromMap(idMap: ReadonlyMap<string, string>): string[] {
  return [...idMap.values()];
}

export type RestoreChannel = {
  id: string;
  type: number;
  parentId: string | null;
};

export function orderChannelsForRestore<T extends RestoreChannel>(channels: T[]): T[] {
  const categories = channels.filter((channel) => channel.type === GUILD_CATEGORY_TYPE);
  const rest = channels.filter((channel) => channel.type !== GUILD_CATEGORY_TYPE);
  return [...categories, ...rest];
}

export function remapOverwriteTargetId(
  oldId: string,
  idMap: Map<string, string>,
  guildId: string,
): string {
  if (oldId === guildId) return guildId;
  return idMap.get(oldId) ?? oldId;
}

/** Member overwrites stay; role overwrites need a live role or @everyone. */
export function resolveRestoreParentId(
  parentId: string | null,
  idMap: ReadonlyMap<string, string>,
): string | null {
  if (!parentId) return null;
  return idMap.get(parentId) ?? null;
}

export function keepRestoreOverwrite(
  overwrite: { id: string; type: number },
  roleIds: ReadonlySet<string>,
  guildId: string,
): boolean {
  if (overwrite.type === 1) return true;
  return overwrite.id === guildId || roleIds.has(overwrite.id);
}
