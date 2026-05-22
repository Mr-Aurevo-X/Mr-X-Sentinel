import type { GuildFeatures } from "@sentinel/shared";

export type FonctionnementSection =
  | "demarrage"
  | "modules"
  | "logs"
  | "moderation"
  | "security"
  | "economy_fun"
  | "levels"
  | "tickets"
  | "templates"
  | "ia_musique"
  | "staff"
  | "dashboard"
  | "depannage";

export const SECTION_LABELS: Record<FonctionnementSection, string> = {
  demarrage: "Démarrage",
  modules: "Modules",
  logs: "Logs",
  moderation: "Modération",
  security: "Sécurité",
  economy_fun: "Économie & Fun",
  levels: "Niveaux XP",
  tickets: "Tickets",
  templates: "Templates",
  ia_musique: "IA & Musique",
  staff: "Staff",
  dashboard: "Dashboard",
  depannage: "Dépannage",
};

export function sectionContent(
  section: FonctionnementSection,
  features: GuildFeatures,
): { title: string; body: string } {
  switch (section) {
    case "demarrage":
      return {
        title: "Démarrage rapide",
        body: [
          "1. Invite le bot avec permissions **Administrateur**.",
          "2. `/setup create_logs:true` — configure sécurité + salons logs.",
          "3. `/fonctionnement` — ce guide (owner uniquement).",
          "4. Attribue le rôle **Logs** à ton staff mod.",
          "5. `/sentinel menu` pour les membres ; `/ban` `/kick` etc. pour la mod.",
        ].join("\n"),
      };
    case "modules":
      return {
        title: "Modules actifs",
        body: Object.entries(features)
          .map(([k, v]) => `• **${k}** : ${v ? "activé" : "désactivé"}`)
          .join("\n"),
      };
    case "logs":
      return {
        title: "Système de logs",
        body: [
          "Catégorie **Logs Sentinel** — 12 salons (mod, security, economy, …).",
          "Bouton **Créer salons logs** ou `/logs create`.",
          "Rôle **Logs** : lecture seule pour le staff.",
        ].join("\n"),
      };
    case "moderation":
      return {
        title: "Modération",
        body: "Slash dédiés : `/ban` `/kick` `/mute` `/warn` `/clear` `/nuke`. Complément : `/panel`. Logs : `#logs-moderation`.",
      };
    case "security":
      return features.security
        ? {
            title: "Sécurité",
            body: "Anti-nuke, anti-raid, automod. `/security status|lockdown|unlock`. Logs : `#logs-security`.",
          }
        : { title: "Sécurité", body: "Module désactivé." };
    case "economy_fun":
      return features.economy
        ? {
            title: "Économie & Fun",
            body: "Hub `/sentinel menu` — daily, work, casino (boutons). Logs : `#logs-economy`.",
          }
        : { title: "Économie", body: "Module désactivé." };
    case "levels":
      return features.levels
        ? { title: "XP", body: "`/rank` — XP par messages. Logs level-up : `#logs-levels`." }
        : { title: "XP", body: "Module désactivé." };
    case "tickets":
      return { title: "Tickets", body: "Panel ticket via boutons. Logs : `#logs-tickets`." };
    case "templates":
      return { title: "Templates", body: "13 modèles de serveur via `/setup` (Phase templates)." };
    case "ia_musique": {
      const lines: string[] = [];
      if (features.ai) lines.push("• /chat message");
      if (features.music) lines.push("• /play query");
      if (features.brain) lines.push("• Brain automod actif");
      return {
        title: "IA & Musique",
        body: lines.length ? lines.join("\n") : "Modules IA/musique désactivés.",
      };
    }
    case "staff":
      return { title: "Staff", body: "Rôles mod/ticket : `/admin` (à venir). Niveaux : Public, Staff, Owner." };
    case "dashboard":
      return { title: "Dashboard", body: "Panel web OAuth : http://localhost:3000 (Phase 6)." };
    case "depannage":
      return {
        title: "Dépannage",
        body: "Vérifie intents (Presence, Members, Message Content), rôle bot en haut, `.env` token. Support : propriétaire du bot.",
      };
    default:
      return { title: "Mr-X Sentinel", body: "Section inconnue." };
  }
}

export function visibleSections(features: GuildFeatures): FonctionnementSection[] {
  const all: FonctionnementSection[] = [
    "demarrage",
    "modules",
    "logs",
    "moderation",
    "security",
    "economy_fun",
    "levels",
    "tickets",
    "templates",
    "ia_musique",
    "staff",
    "dashboard",
    "depannage",
  ];
  return all.filter((s) => {
    if (s === "security" && !features.security) return false;
    if (s === "economy_fun" && !features.economy && !features.fun) return false;
    if (s === "levels" && !features.levels) return false;
    if (s === "ia_musique" && !features.ai && !features.music && !features.brain) return false;
    return true;
  });
}
