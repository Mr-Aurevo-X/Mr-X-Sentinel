export function customId(module: string, action: string, extra?: string): string {
  const base = `sentinel:${module}:${action}`;
  return extra ? `${base}:${extra}` : base;
}

export function parseCustomId(id: string): { module: string; action: string; extra?: string } | null {
  const parts = id.split(":");
  if (parts.length < 3 || parts[0] !== "sentinel") return null;
  return {
    module: parts[1]!,
    action: parts[2]!,
    extra: parts[3],
  };
}
