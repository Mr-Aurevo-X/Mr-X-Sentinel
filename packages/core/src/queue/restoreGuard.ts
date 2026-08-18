export function assertRestorePayloadGuild(
  payloadGuildId: string | undefined,
  guildId: string,
): void {
  if (!payloadGuildId || payloadGuildId !== guildId) {
    throw new Error("Snapshot guild mismatch");
  }
}

export function assertRestorePayloadNotEmpty(payload: { channels?: unknown[] }): void {
  if (!payload.channels || payload.channels.length === 0) {
    throw new Error("Snapshot has no channels");
  }
}
