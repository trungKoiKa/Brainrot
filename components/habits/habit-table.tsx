"use client";

import { useEffect, useRef } from "react";
import { CheckIcon } from "lucide-react";
import { habitTone, type HabitStats } from "@/lib/habits";

const tone = habitTone;
const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const weekday = (day: string) => WEEKDAY[new Date(`${day}T00:00:00Z`).getUTCDay()];

/** Bảng thói quen × ngày, tích được hôm nay và ngày đã qua (SPEC.md mục 5.3). Dùng cho Tuần và Tháng. */
export function HabitTable({
  stats,
  today,
  toggle,
}: {
  stats: HabitStats;
  today: string;
  toggle: (day: string, name: string, on: boolean) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  // Màn hẹp: bảng mở ở ngày 1 thì phải tự cuộn mới thấy hôm nay → cuộn sẵn tới cột hôm nay (chỉ lúc mở)
  useEffect(() => {
    const box = scroller.current;
    const cell = box?.querySelector<HTMLElement>("[data-today]");
    if (box && cell && box.scrollWidth > box.clientWidth) {
      box.scrollLeft = cell.offsetLeft - box.clientWidth / 2;
    }
  }, []);

  return (
    <div ref={scroller} className="-mx-4 overflow-x-auto px-4">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface" />
            {stats.days.map((d) => {
              const p = stats.dayPct[d];
              return (
                <th key={d} className="px-0.5 align-bottom font-normal" title={p === null ? undefined : `${p}% thói quen`}>
                  <div className="mx-auto flex h-8 w-4 items-end">
                    {p !== null && (
                      // 0% chỉ là vạch mảnh trung tính, không tô đỏ cả dãy ngày chưa tích
                      <div
                        className="w-full rounded-sm"
                        style={{ height: p === 0 ? 2 : `${Math.max(p, 8)}%`, background: p === 0 ? "var(--line)" : tone(p) }}
                      />
                    )}
                  </div>
                </th>
              );
            })}
            <th />
          </tr>
          <tr className="text-xs text-muted-foreground">
            <th className="sticky left-0 z-10 bg-surface pr-3 pb-2 text-left font-medium">Thói quen</th>
            {stats.days.map((d) => (
              <th
                key={d}
                data-today={d === today || undefined}
                className={`px-0.5 pb-2 font-normal tabular-nums ${d === today ? "text-primary" : ""}`}
              >
                <span className={`block text-xs ${d === today ? "" : "text-muted-foreground"}`}>{weekday(d)}</span>
                {Number(d.slice(8))}
              </th>
            ))}
            <th className="pb-2 pl-3 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {stats.rows.map((r) => (
            <tr key={r.habit.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 max-w-40 truncate border-t border-line bg-surface py-1.5 pr-3 text-left font-normal"
              >
                {r.habit.name}
              </th>
              {stats.days.map((d) => {
                const on = r.done.has(d);
                const future = d > today;
                return (
                  <td key={d} className={`border-t border-line px-0.5 py-1.5 text-center ${d === today ? "bg-accent-soft/60" : ""}`}>
                    <button
                      type="button"
                      disabled={future}
                      aria-pressed={on}
                      aria-label={`${r.habit.name} ngày ${Number(d.slice(8))}`}
                      onClick={() => toggle(d, r.habit.name, !on)}
                      className={`flex size-8 md:size-6 items-center justify-center rounded border transition-colors ${
                        on ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary"
                      } disabled:cursor-default disabled:opacity-30 disabled:hover:border-input`}
                    >
                      {on && <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={3} />}
                    </button>
                  </td>
                );
              })}
              <td className="border-t border-line py-1.5 pl-3 text-right font-medium tabular-nums" style={{ color: tone(r.pct) }}>
                {r.pct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
