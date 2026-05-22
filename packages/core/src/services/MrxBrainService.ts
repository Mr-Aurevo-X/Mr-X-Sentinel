/**
 * Client HTTP vers MrXBrain (Mr-X-Brain).
 * Utilisé par AutomodModule pour spam / toxicité.
 */

export interface BrainAnalyzeResult {
  spam: number;
  toxicity: number;
  xp_score: number;
  eco_label: number;
  eco_name: string;
  eco_probs: [number, number, number];
}

const BRAIN_URL = (process.env.BRAIN_URL ?? "http://localhost:8765").replace(/\/$/, "");
const BRAIN_KEY = process.env.BRAIN_API_KEY ?? "changeme";
const BRAIN_ENABLED = process.env.BRAIN_ENABLED !== "false";

export const BRAIN_SPAM_THRESHOLD = Number(process.env.BRAIN_SPAM_THRESHOLD ?? "0.65");
export const BRAIN_TOX_THRESHOLD = Number(process.env.BRAIN_TOX_THRESHOLD ?? "0.70");

export function isBrainConfigured(): boolean {
  return BRAIN_ENABLED && Boolean(BRAIN_URL);
}

export async function analyzeWithBrain(
  text: string,
): Promise<BrainAnalyzeResult | null> {
  if (!isBrainConfigured() || !text.trim()) return null;

  try {
    const res = await fetch(`${BRAIN_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": BRAIN_KEY,
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as BrainAnalyzeResult;
  } catch {
    return null;
  }
}
