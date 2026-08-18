import type { GuildKpi } from "@sentinel/shared";
import { Tile } from "@/components/ui/Tile";
import { KPI_HELP } from "@/lib/panel-help";
import { KPI_COLORS, KPI_LABELS } from "./ChartTheme";

function formatDelta(kpi: GuildKpi): string {
  if (kpi.changePct == null) {
    return kpi.previous === 0 && kpi.value !== 0 ? "nouveau vs 7j avant" : "vs 7j avant";
  }
  const sign = kpi.changePct > 0 ? "+" : "";
  return `${sign}${kpi.changePct}% vs 7j avant`;
}

function deltaClass(kpi: GuildKpi): string {
  if (kpi.changePct == null || kpi.changePct === 0) return "kpi-delta";
  if (kpi.id === "automodHits" || kpi.id === "cases") {
    return kpi.changePct > 0 ? "kpi-delta down" : "kpi-delta up";
  }
  return kpi.changePct > 0 ? "kpi-delta up" : "kpi-delta down";
}

export function KpiTile({ kpi }: { kpi: GuildKpi }) {
  return (
    <Tile staticTile>
      <p className="kpi-label">
        <span className="kpi-pip" style={{ background: KPI_COLORS[kpi.id] }} />
        {KPI_LABELS[kpi.id]}
      </p>
      <p className="kpi-value">{kpi.value.toLocaleString("fr-FR")}</p>
      <p className={deltaClass(kpi)}>{formatDelta(kpi)}</p>
      {KPI_HELP[kpi.id] ? <p className="kpi-help">{KPI_HELP[kpi.id]}</p> : null}
    </Tile>
  );
}
