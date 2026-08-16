/**
 * Parked: AutomodModule Brain scoring + logs-brain.
 * Lived in packages/core/src/modules/AutomodModule.ts
 */
import type { Message } from "discord.js";
import {
  analyzeWithBrain,
  BRAIN_SPAM_THRESHOLD,
  BRAIN_TOX_THRESHOLD,
  isBrainConfigured,
} from "./MrxBrainService.js";

export async function collectBrainViolations(content: string): Promise<string[]> {
  const violations: string[] = [];
  if (!isBrainConfigured()) return violations;
  const brain = await analyzeWithBrain(content);
  if (!brain) return violations;
  if (brain.spam >= BRAIN_SPAM_THRESHOLD) {
    violations.push(`MrXBrain spam (${(brain.spam * 100).toFixed(0)}%)`);
  }
  if (brain.toxicity >= BRAIN_TOX_THRESHOLD) {
    violations.push(`MrXBrain toxicité (${(brain.toxicity * 100).toFixed(0)}%)`);
  }
  return violations;
}

export function isBrainViolation(text: string): boolean {
  return text.startsWith("MrXBrain");
}

export function unusedMessage(_message: Message): void {
  // placeholder so restore notes can point at message.guild for logService.log(..., "brain")
}
