import { listTemplates } from "@sentinel/core";

export function templateSlashChoices(): { name: string; value: string }[] {
  return listTemplates()
    .map((t) => ({ name: t.label.slice(0, 100), value: t.key }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .slice(0, 25);
}
