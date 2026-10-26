// Vòng tròn % (SPEC-v0.4 4.2) — SVG thuần, màu theo ngưỡng giống chấm trạng thái Dashboard.
export const toneColor = (pct: number) => (pct >= 70 ? "var(--good)" : pct >= 40 ? "var(--chart-4)" : "var(--danger)");

export function ProgressRing({ pct, size = 96, empty = false }: { pct: number; size?: number; empty?: boolean }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-muted)" strokeWidth="10" />
        {!empty && pct > 0 && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={toneColor(pct)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-xl font-semibold tabular-nums">
        {empty ? "—" : `${pct}%`}
      </span>
    </div>
  );
}
