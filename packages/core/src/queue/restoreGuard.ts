export function assertRestorePayloadGuild(
  payloadGuildId: string | undefined,
  guildId: string,
): void {
  if (!payloadGuildId || payloadGuildId !== guildId) {
    throw new Error("Snapshot guild mismatch");
  }
}
