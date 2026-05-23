import { logger } from "@sentinel/core";

const BRAIN_URL = process.env.BRAIN_URL ?? "http://127.0.0.1:8765";

export type BrainHealth = {
  online: boolean;
  samples?: number;
  ready?: boolean;
  spam?: number;
  toxicity?: number;
  error?: string;
};

export async function checkBrainHealth(): Promise<BrainHealth> {
  try {
    const res = await fetch(`${BRAIN_URL}/status`, {
      signal: AbortSignal.timeout(5000),
      headers: process.env.BRAIN_API_KEY ? { "X-API-Key": process.env.BRAIN_API_KEY } : {},
    });
    if (!res.ok) {
      return { online: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      samples?: number;
      ready?: boolean;
      spam?: number;
      toxicity?: number;
    };
    return { online: true, ...data };
  } catch (e) {
    return { online: false, error: e instanceof Error ? e.message : "unreachable" };
  }
}

export async function logBrainStatusAtBoot(): Promise<void> {
  const health = await checkBrainHealth();
  if (health.online) {
    logger.info(
      { samples: health.samples, ready: health.ready },
      `Mr-X Brain : EN LIGNE (${BRAIN_URL})`,
    );
  } else if (process.env.BRAIN_ENABLED === "true") {
    logger.warn({ err: health.error }, `Mr-X Brain : HORS LIGNE — lance docker compose up -d brain`);
  } else {
    logger.info("Mr-X Brain : non vérifié (BRAIN_ENABLED≠true)");
  }
}
