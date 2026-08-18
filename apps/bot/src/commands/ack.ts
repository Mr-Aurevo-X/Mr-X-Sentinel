import type {
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessageComponentInteraction,
} from "discord.js";

type EphemeralOption = boolean | ((interaction: ChatInputCommandInteraction) => boolean);

const EPHEMERAL_COMPONENT_MODULES = new Set([
  "music",
  "ticket",
  "logs",
  "verify",
  "fun",
  "minijeu",
  "economy",
  "levels",
]);

export type ComponentAckMode = "update" | "ephemeral" | "skip";

export function shouldDeferSlash(
  _commandName: string,
  options: { skipDefer?: boolean } = {},
): boolean {
  return !options.skipDefer;
}

export function resolveCommandEphemeral(
  options: { ephemeral?: EphemeralOption },
  interaction: ChatInputCommandInteraction,
): boolean {
  if (typeof options.ephemeral === "function") return options.ephemeral(interaction);
  return options.ephemeral ?? true;
}

export function formatGatewayPing(ping: number): string {
  if (!Number.isFinite(ping) || ping < 0) return "n/d";
  return `${Math.round(ping)} ms`;
}

export function pickGatewayPing(managerPing: number, shardPings: number[]): number {
  const ready = shardPings.filter((p) => Number.isFinite(p) && p >= 0);
  if (ready.length > 0) return Math.max(...ready);
  return managerPing;
}

export function isInfraUnavailableError(err: unknown): boolean {
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err);
  if (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientRustPanicError" ||
    name === "PrismaClientKnownRequestError"
  ) {
    return /P1001|P1002|P1017|P2024|Can't reach|ECONNREFUSED|ETIMEDOUT|connect/i.test(msg) ||
      name === "PrismaClientInitializationError";
  }
  return /P1001|P1002|P1017|Can't reach database|ECONNREFUSED|ETIMEDOUT|PrismaClientInitialization/i.test(
    `${name} ${msg}`,
  );
}

export const INFRA_UNAVAILABLE_MESSAGE =
  "PostgreSQL inaccessible — vérifie DATABASE_URL puis réessaie.";

export function componentAckMode(module: string, action: string): ComponentAckMode {
  if (module === "ticket" && action === "type") return "skip";
  if (module === "modpanel") return action === "select" ? "update" : "ephemeral";
  if (EPHEMERAL_COMPONENT_MODULES.has(module)) return "ephemeral";
  return "update";
}

export async function ackComponent(
  interaction: MessageComponentInteraction,
  mode: ComponentAckMode,
): Promise<void> {
  if (mode === "skip" || interaction.deferred || interaction.replied) return;
  if (mode === "update") {
    await interaction.deferUpdate();
    return;
  }
  await interaction.deferReply({ ephemeral: true });
}

export async function editComponent(
  interaction: MessageComponentInteraction,
  payload: InteractionEditReplyOptions,
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
    return;
  }
  await interaction.update(payload);
}

export async function ephemeralComponent(
  interaction: MessageComponentInteraction,
  payload: InteractionReplyOptions,
): Promise<void> {
  const opts: InteractionReplyOptions = { ...payload, ephemeral: true };
  if (interaction.deferred || interaction.replied) {
    const { flags: _flags, ephemeral: _ephemeral, ...editOpts } = opts;
    if (interaction.ephemeral) {
      await interaction.editReply(editOpts);
      return;
    }
    await interaction.followUp(opts);
    return;
  }
  await interaction.reply(opts);
}
