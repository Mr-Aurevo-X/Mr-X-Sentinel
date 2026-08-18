export type RestoreMode = "repair" | "full";

export function parseRestoreMode(raw: unknown): RestoreMode {
  return raw === "full" ? "full" : "repair";
}
