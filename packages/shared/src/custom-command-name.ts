export const CUSTOM_COMMAND_NAME_RE = /^[\w-]{1,32}$/;
export const CUSTOM_COMMAND_MAX_PER_GUILD = 20;
export const CUSTOM_COMMAND_BODY_MAX = 2000;
export const CUSTOM_COMMAND_DESC_MAX = 100;

export const CUSTOM_COMMAND_MANAGEMENT_NAMES = [
  "addcommand",
  "removecommand",
  "listcommands",
] as const;

export type CustomCommandNameResult =
  | { ok: true; name: string }
  | { ok: false; reason: "invalid" | "reserved" };

export function normalizeCustomCommandName(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateCustomCommandName(
  raw: string,
  reservedNames: Iterable<string> = [],
): CustomCommandNameResult {
  const name = normalizeCustomCommandName(raw);
  if (!name || !CUSTOM_COMMAND_NAME_RE.test(name)) {
    return { ok: false, reason: "invalid" };
  }
  const reserved = new Set<string>([
    ...CUSTOM_COMMAND_MANAGEMENT_NAMES,
    ...[...reservedNames].map((n) => n.toLowerCase()),
  ]);
  if (reserved.has(name)) {
    return { ok: false, reason: "reserved" };
  }
  return { ok: true, name };
}

export function defaultCustomCommandDescription(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  const text = flat || "Commande personnalisée";
  return text.slice(0, CUSTOM_COMMAND_DESC_MAX);
}
