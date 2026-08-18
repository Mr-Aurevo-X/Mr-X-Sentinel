import { isGuildFeatureKey, type GuildFeatures } from "./features.js";

export const SETUP_TOGGLE_FEATURES = [
  "economy",
  "levels",
  "tickets",
  "fun",
  "music",
  "community",
] as const;

export type SetupToggleFeature = (typeof SETUP_TOGGLE_FEATURES)[number];

const SETUP_TOGGLE = new Set<string>(SETUP_TOGGLE_FEATURES);

export function isSetupToggleFeature(value: string): value is SetupToggleFeature {
  return isGuildFeatureKey(value) && SETUP_TOGGLE.has(value);
}

export type MemberHubEntry = {
  feature: keyof GuildFeatures | "always";
  module: string;
  action: string;
  label: string;
  style: "Primary" | "Secondary" | "Success";
};

export const MEMBER_HUB_ENTRIES: MemberHubEntry[] = [
  { feature: "economy", module: "sentinel", action: "eco", label: "Économie", style: "Primary" },
  { feature: "fun", module: "sentinel", action: "gamble", label: "Casino", style: "Secondary" },
  { feature: "levels", module: "sentinel", action: "rank", label: "Mon XP", style: "Secondary" },
  { feature: "economy", module: "economy", action: "daily", label: "Daily", style: "Success" },
  { feature: "economy", module: "economy", action: "work", label: "Travail", style: "Secondary" },
  { feature: "fun", module: "fun", action: "slots", label: "Slots", style: "Secondary" },
  { feature: "tickets", module: "ticket", action: "open", label: "Ticket", style: "Primary" },
  { feature: "always", module: "sentinel", action: "help", label: "Aide", style: "Secondary" },
];

export function visibleMemberHubEntries(features: GuildFeatures): MemberHubEntry[] {
  return MEMBER_HUB_ENTRIES.filter((entry) => entry.feature === "always" || features[entry.feature]);
}

export function helpPublicDescription(features: GuildFeatures): string {
  const lines = ["**Hub :** `/sentinel menu` · `/help`"];
  if (features.economy) {
    lines.push("**Économie :** `/balance` `/daily` `/work` `/shop` `/pay`");
  }
  if (features.fun) {
    lines.push("**Fun :** `/fun`");
  }
  if (features.levels) {
    lines.push("**XP :** `/rank` `/leaderboard`");
  }
  if (features.tickets) {
    lines.push("**Tickets :** `/ticket open`");
  }
  lines.push("**Info :** `/serverinfo` `/avatar` `/userinfo` `/botinfo`");
  if (features.music) {
    lines.push("**Musique :** `/music play` `/music`");
  }
  if (features.community) {
    lines.push("**Communauté :** `/suggest` `/poll` `/afk`");
  }
  lines.push("**Commandes perso :** `/listcommands`");
  return lines.join("\n");
}
