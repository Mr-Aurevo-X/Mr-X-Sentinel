export const AUTO_SNAPSHOT_KEEP = 12;

export function autoSnapshotIdsToDelete(
  autoSnapshots: ReadonlyArray<{ id: string; createdAt: Date }>,
  keep = AUTO_SNAPSHOT_KEEP,
): string[] {
  const sorted = [...autoSnapshots].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return sorted.slice(keep).map((snap) => snap.id);
}
