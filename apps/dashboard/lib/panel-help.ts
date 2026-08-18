export const FEATURE_HELP: Record<string, { label: string; hint: string }> = {
  security: {
    label: "Sécurité",
    hint: "Anti-nuke, anti-raid et quarantaine. À laisser on sauf serveur de test.",
  },
  snapshots: {
    label: "Sauvegardes",
    hint: "Captures auto de rôles, salons et overwrites. Sert à restaurer après un raid.",
  },
  automod: {
    label: "Automod",
    hint: "Filtres sur les messages (invites, flood, mots interdits). Le bot agit tout seul.",
  },
  moderation: {
    label: "Modération",
    hint: "Commandes /warn /mute /kick /ban et journal des cas.",
  },
  economy: {
    label: "Économie",
    hint: "Daily, work, crime et boutique. Désactive si tu n’en veux pas.",
  },
  levels: {
    label: "Niveaux",
    hint: "XP par message et rôles de palier. Compte aussi pour les stats messages.",
  },
  fun: {
    label: "Fun",
    hint: "Mini-jeux et commandes fun. Peut être coupé sans casser le reste.",
  },
  tickets: {
    label: "Tickets",
    hint: "Salons support privés. Il faut aussi /ticket setup dans Discord.",
  },
  templates: {
    label: "Templates",
    hint: "Presets de salons/rôles à appliquer depuis les commandes owner.",
  },
  community: {
    label: "Communauté",
    hint: "Welcome, vérif, starboard, sondages, giveaways.",
  },
  music: {
    label: "Musique",
    hint: "Lecture via Lavalink. Inutile si tu n’as pas de nœud musique.",
  },
};

export const NAV_HELP: Record<string, string> = {
  "": "Lockdown, langue et interrupteurs de modules.",
  "/analytics": "Courbes horaires — jamais le texte des messages.",
  "/security": "Anti-nuke, anti-raid, whitelist et cas (lecture).",
  "/automod": "Filtres messages : invites, flood, mots, URLs.",
  "/community": "Welcome, vérif, starboard, salons spéciaux.",
  "/economy": "Montants daily/work/crime et boutique.",
  "/levels": "XP, rôles de palier et classement.",
  "/tickets": "Panneau support et file des tickets.",
  "/logs": "Salons de logs, webhook d’alerte, événements.",
  "/backups": "Snapshots rôles/salons — pas les messages.",
};

export const KPI_HELP: Record<string, string> = {
  messages: "Messages non-bot. Le % compare à la même durée juste avant.",
  memberNet: "Joins moins leaves. Positif = le serveur grandit.",
  automodHits: "Messages qui ont cassé une règle. Hausse = plus de spam, ou règles trop serrées.",
  cases: "Sanctions enregistrées (/warn /mute /kick /ban). Lecture seule ici.",
  ticketsOpened: "Nouveaux tickets ouverts dans la période.",
  voiceMinutes: "Minutes passées en vocal (sessions fermées).",
};

export const RANGE_HELP: Record<string, string> = {
  "24h": "Heure par heure — utile pendant un raid ou un event.",
  "7d": "Jour par jour. Les tuiles du haut comparent à la semaine d’avant.",
  "30d": "Tendance mensuelle, plus lissée.",
};

export const NUKE_THRESHOLD_LABEL: Record<string, string> = {
  BAN: "Bans",
  KICK: "Kicks",
  CHANNEL_CREATE: "Créations de salons",
  ROLE_CREATE: "Créations de rôles",
  ROLE_UPDATE: "Modifs de rôles",
  CHANNEL_UPDATE: "Modifs de salons",
};

export const NUKE_THRESHOLD_HELP: Record<string, string> = {
  BAN: "Nombre de bans en X secondes avant action (souvent un raid staff).",
  KICK: "Même logique pour les kicks en rafale.",
  CHANNEL_CREATE: "Trop de salons créés d’un coup = nuke.",
  ROLE_CREATE: "Trop de rôles créés d’un coup.",
  ROLE_UPDATE: "Modifs de rôles en rafale (perms / nom / couleur).",
  CHANNEL_UPDATE: "Modifs de salons en rafale (nom, perms, suppression partielle).",
};
