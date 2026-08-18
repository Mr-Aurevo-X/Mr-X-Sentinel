export const CHART = {
  muted: "#8d8d8d",
  grid: "rgba(255,255,255,0.08)",
  tooltipBg: "#101010",
  tooltipBorder: "rgba(255, 255, 255, 0.14)",
  text: "#f3f3f3",
} as const;

export const DATA = {
  joins: "#2ee59d",
  leaves: "#ff6b2c",
  members: "#7aa2ff",
  messages: "#3ee0ff",
  automod: "#f5c518",
  cases: "#ff2d55",
  tickets: "#ff9f43",
  voice: "#b388ff",
} as const;

export const SEVERITY_COLORS = {
  LOW: "#2ee59d",
  MEDIUM: "#f5c518",
  HIGH: "#ff6b2c",
  CRITICAL: "#ff2d55",
} as const;

export const SEVERITY_LABELS = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
} as const;

export const CHANNEL_RANKS = [
  "#3ee0ff",
  "#7aa2ff",
  "#b388ff",
  "#e879f9",
  "#ff9f43",
  "#f5c518",
  "#2ee59d",
  "#ff6b2c",
] as const;

export const KPI_COLORS = {
  messages: DATA.messages,
  memberNet: DATA.joins,
  automodHits: DATA.automod,
  cases: DATA.cases,
  ticketsOpened: DATA.tickets,
  voiceMinutes: DATA.voice,
} as const;

export const tooltipStyle = {
  background: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: 12,
  color: CHART.text,
};

export const KPI_LABELS = {
  messages: "Messages",
  memberNet: "Solde membres",
  automodHits: "Automod",
  cases: "Cas",
  ticketsOpened: "Tickets",
  voiceMinutes: "Minutes vocal",
} as const;

const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [12, 22, 40]],
  [0.35, [0, 194, 255]],
  [0.7, [245, 197, 24]],
  [1, [255, 45, 85]],
];

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function heatmapColor(intensity: number): string {
  const t = Math.min(1, Math.max(0, intensity));
  let from = HEAT_STOPS[0]!;
  let to = HEAT_STOPS[HEAT_STOPS.length - 1]!;
  for (let i = 0; i < HEAT_STOPS.length - 1; i += 1) {
    const current = HEAT_STOPS[i]!;
    const next = HEAT_STOPS[i + 1]!;
    if (t >= current[0] && t <= next[0]) {
      from = current;
      to = next;
      break;
    }
  }
  const span = to[0] - from[0] || 1;
  const local = (t - from[0]) / span;
  const r = lerp(from[1][0], to[1][0], local);
  const g = lerp(from[1][1], to[1][1], local);
  const b = lerp(from[1][2], to[1][2], local);
  return `rgb(${r}, ${g}, ${b})`;
}
