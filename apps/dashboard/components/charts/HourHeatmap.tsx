import { heatmapColor } from "./ChartTheme";

export function HourHeatmap({ cells, days }: { cells: number[][]; days: string[] }) {
  const max = Math.max(0, ...cells.flat());
  return (
    <div className="heatmap" role="img" aria-label="Heatmap des messages sur 7 jours">
      <div className="heatmap-hours">
        <span className="heatmap-day-label" />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={hour} className="heatmap-hour">
            {hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}
          </span>
        ))}
      </div>
      {cells.map((row, day) => (
        <div key={days[day] ?? day} className="heatmap-row">
          <span className="heatmap-day-label">{days[day] ?? ""}</span>
          {row.map((value, hour) => {
            const intensity = max === 0 ? 0 : value / max;
            return (
              <span
                key={`${day}-${hour}`}
                className="heatmap-cell"
                title={`${days[day] ?? ""} ${String(hour).padStart(2, "0")}:00 — ${value} msg`}
                style={{ background: heatmapColor(intensity) }}
              />
            );
          })}
        </div>
      ))}
      <p className="heatmap-scale">
        <span>Calme</span>
        <span className="heatmap-scale-bar" />
        <span>Pic</span>
      </p>
    </div>
  );
}
