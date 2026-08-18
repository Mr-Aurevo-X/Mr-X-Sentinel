import { parseGuildConfig, type GuildConfig } from "@sentinel/shared";
import type { DiscordResources } from "@/lib/discord-resources";

export const DEMO_GUILD_ID = "demo";

export const DEMO_RESOURCES: DiscordResources = {
  available: true,
  channels: [
    { id: "ch-cat-commu", name: "Communauté", type: 4, parentId: null },
    { id: "ch-general", name: "général", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-memes", name: "memes", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-welcome", name: "bienvenue", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-verify", name: "vérification", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-starboard", name: "starboard", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-birthday", name: "anniversaires", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-spam", name: "spam-bots", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-counting", name: "comptage", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-levelup", name: "levels", type: 0, parentId: "ch-cat-commu" },
    { id: "ch-cat-staff", name: "Staff", type: 4, parentId: null },
    { id: "ch-modlog", name: "mod-log", type: 0, parentId: "ch-cat-staff" },
    { id: "ch-tickets-panel", name: "tickets", type: 0, parentId: "ch-cat-staff" },
    { id: "ch-cat-tickets", name: "Tickets ouverts", type: 4, parentId: null },
    { id: "ch-hub", name: "Créer un vocal", type: 2, parentId: "ch-cat-commu" },
    { id: "ch-counter", name: "Membres: 1842", type: 2, parentId: "ch-cat-commu" },
  ],
  roles: [
    { id: "role-admin", name: "Admin", managed: false, position: 10 },
    { id: "role-mod", name: "Modérateur", managed: false, position: 8 },
    { id: "role-support", name: "Support", managed: false, position: 7 },
    { id: "role-vip", name: "VIP", managed: false, position: 6 },
    { id: "role-ref", name: "Niveau 10", managed: false, position: 5 },
    { id: "role-verified", name: "Vérifié", managed: false, position: 4 },
    { id: "role-member", name: "Membre", managed: false, position: 3 },
    { id: "role-unverified", name: "Arrivant", managed: false, position: 2 },
    { id: "role-quarantine", name: "Quarantine", managed: false, position: 1 },
    { id: "role-bot", name: "Sentinel", managed: true, position: 9 },
  ],
};

export const DEMO_CONFIG: GuildConfig = parseGuildConfig({
  locale: "fr",
  modLogChannelId: "ch-modlog",
  alertWebhookUrl: null,
  quarantineRoleId: "role-quarantine",
  features: {
    security: true,
    snapshots: true,
    automod: true,
    moderation: true,
    economy: true,
    levels: true,
    fun: true,
    tickets: true,
    templates: true,
    community: true,
    music: true,
  },
  tickets: {
    panelChannelId: "ch-tickets-panel",
    categoryId: "ch-cat-tickets",
    supportRoleIds: ["role-support", "role-mod"],
  },
  verification: {
    enabled: true,
    channelId: "ch-verify",
    verifiedRoleId: "role-verified",
    unverifiedRoleId: "role-unverified",
    useTurnstile: false,
  },
  levels: {
    levelUpChannelId: "ch-levelup",
    rewardRolesEnabled: true,
    referenceRoleId: "role-ref",
    botRoleId: "role-bot",
  },
  welcome: {
    welcomeChannelId: "ch-welcome",
    goodbyeChannelId: "ch-welcome",
    autoRoleId: "role-member",
  },
  staff: { modRoleIds: ["role-mod", "role-admin"] },
  starboard: { enabled: true, channelId: "ch-starboard", threshold: 5 },
  birthday: { channelId: "ch-birthday", entries: {} },
  tempVoice: { hubChannelId: "ch-hub" },
  counting: { channelId: "ch-counting", nextNumber: 128, lastUserId: "user-lena", highScore: 342 },
  channels: {
    spamChannelId: "ch-spam",
    counterChannelId: "ch-counter",
    counterTemplate: "Membres: {count}",
  },
  automod: {
    enabled: true,
    wordBlacklist: ["nitro gratuit", "steamcommunlty", "free discord"],
    blockedUrls: ["bit.ly", "grabify.link"],
    allowedInviteGuilds: ["123456789012345678"],
  },
});

export const DEMO_CASES = [
  {
    id: "case-1",
    caseNumber: 104,
    type: "WARN",
    targetId: "user-nico",
    moderatorId: "user-mod",
    reason: "Spam liens dans #général",
    active: true,
    createdAt: "2026-08-16T18:22:00.000Z",
  },
  {
    id: "case-2",
    caseNumber: 103,
    type: "MUTE",
    targetId: "user-alex",
    moderatorId: "user-mod",
    reason: "Flood vocal",
    active: true,
    createdAt: "2026-08-15T21:04:00.000Z",
  },
  {
    id: "case-3",
    caseNumber: 102,
    type: "KICK",
    targetId: "user-raid",
    moderatorId: "user-admin",
    reason: "Compte raid",
    active: false,
    createdAt: "2026-08-14T09:11:00.000Z",
  },
];

export const DEMO_WHITELIST = [
  { id: "wl-1", userId: "user-owner", level: "EXTRA_OWNER" },
  { id: "wl-2", userId: "user-admin", level: "TRUSTED" },
];

export const DEMO_POLLS = [
  {
    id: "poll-1",
    question: "Quel event la semaine prochaine ?",
    channelId: "ch-general",
    endsAt: "2026-08-20T20:00:00.000Z",
    ended: false,
  },
  {
    id: "poll-2",
    question: "Nouveau rôle couleur ?",
    channelId: "ch-general",
    endsAt: "2026-08-12T18:00:00.000Z",
    ended: true,
  },
];

export const DEMO_GIVEAWAYS = [
  {
    id: "gw-1",
    prize: "Nitro 1 mois",
    winners: 1,
    channelId: "ch-general",
    endsAt: "2026-08-22T19:00:00.000Z",
    ended: false,
  },
  {
    id: "gw-2",
    prize: "Clé Steam",
    winners: 2,
    channelId: "ch-memes",
    endsAt: "2026-08-10T19:00:00.000Z",
    ended: true,
  },
];

export const DEMO_SHOP = [
  { id: "shop-1", name: "Rôle VIP", price: 5000, roleId: "role-vip" },
  { id: "shop-2", name: "Couleur custom", price: 2500, roleId: null },
  { id: "shop-3", name: "Ticket event", price: 800, roleId: null },
];

export const DEMO_LEVELS = [
  { userId: "user-lena", xp: 18420, level: 24 },
  { userId: "user-nico", xp: 15110, level: 21 },
  { userId: "user-mod", xp: 9800, level: 16 },
  { userId: "user-alex", xp: 6400, level: 12 },
  { userId: "user-kai", xp: 2100, level: 6 },
];

export const DEMO_TICKETS = [
  {
    id: "t-1",
    channelId: "ticket-lena",
    ownerId: "user-lena",
    claimedBy: "user-mod",
    status: "open",
    ticketType: "support",
  },
  {
    id: "t-2",
    channelId: "ticket-nico",
    ownerId: "user-nico",
    claimedBy: null,
    status: "open",
    ticketType: "report",
  },
  {
    id: "t-3",
    channelId: "ticket-alex",
    ownerId: "user-alex",
    claimedBy: "user-support",
    status: "closed",
    ticketType: "support",
  },
];

export const DEMO_LOG_CHANNELS = [
  { logType: "moderation", channelId: "ch-modlog" },
  { logType: "automod", channelId: "ch-modlog" },
  { logType: "members", channelId: "ch-welcome" },
  { logType: "tickets", channelId: "ch-tickets-panel" },
];

export const DEMO_EVENTS = [
  {
    id: "ev-1",
    type: "MASS_BAN",
    severity: "CRITICAL",
    actorId: "user-raid",
    createdAt: "2026-08-16T22:14:00.000Z",
  },
  {
    id: "ev-2",
    type: "WEBHOOK_CREATE",
    severity: "HIGH",
    actorId: "user-alex",
    createdAt: "2026-08-16T11:02:00.000Z",
  },
  {
    id: "ev-3",
    type: "JOIN_SPIKE",
    severity: "MEDIUM",
    actorId: null,
    createdAt: "2026-08-15T19:40:00.000Z",
  },
  {
    id: "ev-4",
    type: "AUTOMOD_HIT",
    severity: "LOW",
    actorId: "user-nico",
    createdAt: "2026-08-15T08:12:00.000Z",
  },
];

export const DEMO_SNAPSHOTS = [
  { id: "snap-nightly-01", label: "auto", createdAt: "2026-08-17T03:00:00.000Z", sizeBytes: 482_112 },
  { id: "snap-manual-02", label: "avant event", createdAt: "2026-08-14T16:30:00.000Z", sizeBytes: 461_008 },
  { id: "snap-initial-03", label: "initial", createdAt: "2026-07-02T10:00:00.000Z", sizeBytes: 390_220 },
];
