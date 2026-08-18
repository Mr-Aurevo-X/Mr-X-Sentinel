import { dashboardPublicUrl, visibleGuildFeatures, type GuildFeatures } from "@sentinel/shared";

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
  | "musique"
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
  musique: "Musique",
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
          "2. `/setup create_logs:true` — logs + rôle Quarantine. La sécurité reste en **surveillance**.",
          "3. Active les modules (éco, XP, tickets…) via les boutons du setup ou `/config feature`.",
          "4. `/security whitelist_add` pour le staff de confiance.",
          "5. `/security arm` — lockdown / quarantine / restore repair deviennent actifs.",
          "6. `/fonctionnement` — ce guide (owner uniquement).",
        ].join("\n"),
      };
    case "modules":
      return {
        title: "Modules actifs",
        body: visibleGuildFeatures(features)
          .map(([k, v]) => `• **${k}** : ${v ? "activé" : "désactivé"}`)
          .join("\n"),
      };
    case "logs":
      return {
        title: "Système de logs",
        body: [
          "Catégorie **Logs Sentinel** — 10 types (mod, security, economy, …).",
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
            body: [
              "Anti-nuke, anti-raid, automod.",
              "Après `/setup` : **surveillance seule** (logs).",
              "`/security whitelist_add` puis `/security arm` pour exécuter lockdown / quarantine / restore repair.",
              "`/security disarm` pour revenir en surveillance.",
              "Restore auto = réparation (recrée le manquant). Restore **full** = owner, optionnel.",
              "`/security status|lockdown|unlock`. Logs : `#logs-security`.",
            ].join("\n"),
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
      return { title: "Templates", body: "14 modèles de serveur via `/setup`." };
    case "musique":
      return features.music
        ? { title: "Musique", body: "`/music play` (Lavalink). Sources à vos risques." }
        : { title: "Musique", body: "Module désactivé." };
    case "staff":
      return {
        title: "Staff",
        body: "Rôles mod/ticket : `/admin roles`. Panneau : `/admin panel`. Annonces / boutique : `/admin announce` `/admin shop_add`. Niveaux : Public, Staff, Owner.",
      };
    case "dashboard":
      return {
        title: "Dashboard",
        body: `Panel web OAuth : ${dashboardPublicUrl()} — commande owner : \`/dashboard\`. Lance \`pnpm dev:dashboard\` (ou \`pnpm dev\`). Pas dans Docker local.`,
      };
    case "depannage":
      return {
        title: "Dépannage",
        body: "Vérifie intents (Members, Message Content), rôle bot en haut, `.env` token. Support : propriétaire du bot.",
      };
    default: {
      const _exhaustive: never = section;
      void _exhaustive;
      return { title: "Mr-X Sentinel", body: "Section inconnue." };
    }
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
    "musique",
    "staff",
    "dashboard",
    "depannage",
  ];
  return all.filter((s) => {
    if (s === "security" && !features.security) return false;
    if (s === "economy_fun" && !features.economy && !features.fun) return false;
    if (s === "levels" && !features.levels) return false;
    if (s === "tickets" && !features.tickets) return false;
    if (s === "musique" && !features.music) return false;
    return true;
  });
}
