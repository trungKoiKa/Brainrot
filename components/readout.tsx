// Hàng chỉ số đầu trang (DESIGN.md → Hàng chỉ số): mỗi chỉ số một ô rời bo góc, cách nhau 12px; nhãn nhỏ viết hoa, giá trị lớn đậm.
import type { ReactNode } from "react";

export type ReadoutItem = { label: string; value: ReactNode; note?: ReactNode; accent?: boolean };

export function Readouts({ items, className = "" }: { items: ReadoutItem[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${className}`}>
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-col rounded-xl border border-line bg-surface px-4 py-3.5">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{it.label}</dt>
          <dd className={`mt-1.5 text-2xl leading-tight font-semibold tabular-nums ${it.accent ? "text-primary" : ""}`}>{it.value}</dd>
          {it.note && <dd className="mt-1 text-xs text-muted-foreground">{it.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
