// Hàng chỉ số đầu trang (DESIGN.md → Hàng chỉ số): ô chung viền, nhãn mono viết hoa, giá trị mono lớn.
import type { ReactNode } from "react";

export type ReadoutItem = { label: string; value: ReactNode; note?: ReactNode; accent?: boolean };

export function Readouts({ items, className = "" }: { items: ReadoutItem[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 border-t border-l border-line bg-surface md:grid-cols-4 ${className}`}>
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-col border-r border-b border-line px-4 py-3">
          <dt className="font-mono text-xs text-muted-foreground uppercase">{it.label}</dt>
          <dd className={`mt-1 font-mono text-2xl tabular-nums ${it.accent ? "text-primary" : ""}`}>{it.value}</dd>
          {it.note && <dd className="mt-0.5 text-xs text-muted-foreground">{it.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
