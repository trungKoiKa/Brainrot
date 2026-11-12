import Link from "next/link";
import { toneColor } from "./progress-ring";

export type PeriodBar = { href: string; label: string; pct: number; total: number; current: boolean; /** kỳ đã kết thúc → mới tô màu theo ngưỡng */ ended: boolean };

/** Cột % các kỳ con (Năm → Quý/Tháng, Quý → Tháng, Tháng → Tuần), bấm cột để mở kỳ đó (SPEC.md mục 5.3). */
export function PeriodBars({ bars }: { bars: PeriodBar[] }) {
  return (
    <ol className="flex h-40 items-end gap-1.5">
      {bars.map((b) => (
        <li key={b.href} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-xs tabular-nums text-muted-foreground">{b.total ? `${b.pct}%` : "—"}</span>
          <Link
            href={b.href}
            aria-label={b.total ? `${b.label}: ${b.pct}% (${b.total} mục tiêu)` : `${b.label}: chưa có mục tiêu`}
            title={b.total ? `${b.label}: ${b.pct}% (${b.total} mục tiêu)` : `${b.label}: chưa có mục tiêu`}
            className="flex w-full flex-1 items-end rounded-md transition-opacity hover:opacity-80"
          >
            <span
              className="w-full rounded-md"
              style={{
                height: b.total ? `${Math.max(b.pct, 4)}%` : 4,
                background: b.total ? toneColor(b.pct, !b.ended) : "var(--line)",
              }}
            />
          </Link>
          <span className={`text-xs tabular-nums ${b.current ? "font-semibold text-primary" : "text-muted-foreground"}`}>
            {b.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
