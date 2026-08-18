export const GHOST_LOCKDOWN_COUNT = 3;
export const GHOST_WINDOW_SEC = 30;

export type GhostAuditDecision = {
  severity: "HIGH" | "CRITICAL";
  shouldLockdown: boolean;
  reason: string;
};

export function evaluateGhostAudit(ghostCount: number): GhostAuditDecision {
  if (ghostCount >= GHOST_LOCKDOWN_COUNT) {
    return {
      severity: "CRITICAL",
      shouldLockdown: true,
      reason: `Ghost events: ${ghostCount} in ${GHOST_WINDOW_SEC}s`,
    };
  }
  return {
    severity: "HIGH",
    shouldLockdown: false,
    reason: "Ghost event — unknown executor",
  };
}
