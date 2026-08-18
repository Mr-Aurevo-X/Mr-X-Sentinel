export type ManagedGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

const MANAGE_GUILD = 0x20n;

export function filterManagedGuilds(guilds: ManagedGuild[]): ManagedGuild[] {
  return guilds.filter((guild) => {
    if (guild.owner) return true;
    try {
      const perms = BigInt(guild.permissions);
      return (perms & MANAGE_GUILD) === MANAGE_GUILD;
    } catch {
      return false;
    }
  });
}

export type GuildsLoadReason = "ok" | "no_token" | "discord";

export function guildsLoadMessage(reason: Exclude<GuildsLoadReason, "ok">, status?: number): string {
  switch (reason) {
    case "no_token":
      return "Session Discord incomplète — déconnecte-toi puis reconnecte.";
    case "discord":
      return status
        ? `Discord a refusé la liste des serveurs (HTTP ${status}). Réessaie dans un instant.`
        : "Discord a refusé la liste des serveurs. Réessaie dans un instant.";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}
