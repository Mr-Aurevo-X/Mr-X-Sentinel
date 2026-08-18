"use client";

import type { DiscordResources } from "@/lib/discord-resources";

export function RoleSelect({
  resources,
  value,
  onChange,
  multiple = false,
  allowEmpty = true,
  guildId,
}: {
  resources: DiscordResources;
  value: string | string[] | null;
  onChange: (next: string | string[] | null) => void;
  multiple?: boolean;
  allowEmpty?: boolean;
  guildId: string;
}) {
  const roles = resources.roles.filter((role) => role.id !== guildId && !role.managed);

  if (!resources.available) {
    if (multiple) {
      const joined = Array.isArray(value) ? value.join("\n") : "";
      return (
        <textarea
          rows={3}
          value={joined}
          onChange={(e) => onChange(e.target.value.split("\n").map((row) => row.trim()).filter(Boolean))}
          placeholder="Un ID rôle par ligne"
        />
      );
    }
    return (
      <input
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value.trim() || null)}
        placeholder="ID rôle"
      />
    );
  }

  if (multiple) {
    const selected = new Set(Array.isArray(value) ? value : []);
    return (
      <select
        multiple
        value={[...selected]}
        size={Math.min(8, Math.max(3, roles.length))}
        onChange={(e) => {
          const next = [...e.target.selectedOptions].map((option) => option.value);
          onChange(next);
        }}
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      {allowEmpty ? <option value="">—</option> : null}
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
    </select>
  );
}
