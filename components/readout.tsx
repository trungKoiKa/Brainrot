// Hàng chỉ số đầu trang (DESIGN.md → Hàng chỉ số): một khung bo góc chia ô bằng kẻ 1px, nhãn nhỏ viết hoa, giá trị lớn đậm.
import type { ReactNode } from "react";

export type ReadoutItem = { label: string; value: ReactNode; note?: ReactNode; accent?: boolean };

export function Readouts({ items, className = "" }: { items: ReadoutItem[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-px overflow-clip rounded-xl border border-line bg-line md:grid-cols-4 ${className}`}>
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-col bg-surface px-4 py-3">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{it.label}</dt>
          <dd className={`mt-1 text-2xl font-semibold tabular-nums ${it.accent ? "text-primary" : ""}`}>{it.value}</dd>
          {it.note && <dd className="mt-0.5 text-xs text-muted-foreground">{it.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
