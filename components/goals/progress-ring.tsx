// Vòng tròn % (SPEC-v0.4 4.2) — SVG thuần, màu theo ngưỡng giống chấm trạng thái Dashboard.
// `neutral`: kỳ chưa kết thúc → chưa phán xét, dùng màu chủ đạo (SPEC-v1.0, Goal đợt 1).
export const toneColor = (pct: number, neutral = false) =>
  neutral ? "var(--primary)" : pct >= 70 ? "var(--good)" : pct >= 40 ? "var(--warning)" : "var(--danger)";

export function ProgressRing({
  pct,
  size = 96,
  empty = false,
  neutral = false,
}: {
  pct: number;
  size?: number;
  empty?: boolean;
  neutral?: boolean;
}) {
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
            stroke={toneColor(pct, neutral)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
          />
        )}
      </svg>
      {/* vòng nhỏ (thẻ quý/tháng, Dashboard): chữ nhỏ hơn để "100%" không tràn khỏi vòng */}
      <span
        className={`absolute inset-0 flex items-center justify-center font-serif font-semibold tabular-nums ${size < 80 ? "text-sm" : "text-xl"}`}
      >
        {empty ? "—" : `${pct}%`}
      </span>
    </div>
  );
}
