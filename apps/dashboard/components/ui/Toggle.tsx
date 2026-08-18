export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="toggle">
      <span className={`toggle-track${checked ? " on" : ""}`} aria-hidden>
        <span className="toggle-knob" />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
      <span>
        {label}
        {hint ? <span className="toggle-hint">{hint}</span> : null}
      </span>
    </label>
  );
}
