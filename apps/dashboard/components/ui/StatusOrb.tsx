export function StatusOrb({ live }: { live: boolean }) {
  return <span className={`status-orb ${live ? "live" : "idle"}`} aria-hidden />;
}
