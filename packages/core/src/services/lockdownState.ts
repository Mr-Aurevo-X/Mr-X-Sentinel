export type ChannelLockSnapshot = {
  channelId: string;
  rateLimitPerUser: number;
  hadEveryoneOverwrite: boolean;
  everyoneAllow: string | null;
  everyoneDeny: string | null;
};

export type LockableChannelLike = {
  isTextBased: () => boolean;
  isDMBased: () => boolean;
  isThread: () => boolean;
  permissionOverwrites?: unknown;
};

export function isLockableGuildChannel(channel: LockableChannelLike): boolean {
  return (
    channel.isTextBased() &&
    !channel.isDMBased() &&
    !channel.isThread() &&
    "permissionOverwrites" in channel &&
    channel.permissionOverwrites != null
  );
}

export function parseLockdownSnapshot(raw: string | null): ChannelLockSnapshot[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isChannelLockSnapshot);
  } catch {
    return null;
  }
}

function isChannelLockSnapshot(value: unknown): value is ChannelLockSnapshot {
  if (!value || typeof value !== "object") return false;
  const row = value as ChannelLockSnapshot;
  return typeof row.channelId === "string" && typeof row.hadEveryoneOverwrite === "boolean";
}
