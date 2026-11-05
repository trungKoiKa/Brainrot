"use client";

import { useEffect, useRef } from "react";
import { CheckIcon } from "lucide-react";
import { Card } from "@/components/card";
import { ErrorNotice } from "@/components/tasks/task-row";
import { Progress } from "@/components/ui/progress";
import { monthStats } from "@/lib/habits";
import type { Habit } from "@/lib/types";
import { HabitManager } from "./habit-manager";
import { useHabitDays } from "./use-habit-days";

// Ngưỡng màu giống chấm trạng thái Dashboard: ≥ 70% ổn, 40–69% cần để ý, < 40% cần xử lý (SPEC-v0.4 3.3)
const tone = (pct: number) => (pct >= 70 ? "var(--good)" : pct >= 40 ? "var(--chart-4)" : "var(--danger)");
const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const weekday = (day: string) => WEEKDAY[new Date(`${day}T00:00:00Z`).getUTCDay()];

/** Bảng thói quen × ngày của một tháng (SPEC-v0.4 3.3). */
export function HabitMonth({
  month,
  today,
  habits,
  doneByDay,
}: {
  month: string;
  today: string;
  habits: Habit[];
  doneByDay: Record<string, string[]>;
}) {
  const { days: done, toggle, error, dismissError } = useHabitDays(doneByDay);
  const stats = monthStats(habits, done, month, today);
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
    <div className="space-y-5">
      <Card title="Thói quen" action={<span className="text-sm text-muted-foreground">{stats.elapsed} ngày đã qua</span>}>
        {error && <ErrorNotice message={error} onDismiss={dismissError} />}
        {stats.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có thói quen nào trong tháng này — thêm ở phần dưới.</p>
        ) : (
          <div ref={scroller} className="-mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
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
                      <span className="block text-[0.65rem] opacity-70">{weekday(d)}</span>
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
                            className={`flex size-5 items-center justify-center rounded border transition-colors ${
                              on ? "border-primary bg-primary text-primary-foreground" : "border-line hover:border-primary"
                            } disabled:cursor-default disabled:opacity-30 disabled:hover:border-line`}
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
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Tổng kết tháng">
          {stats.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
          ) : (
            <ul className="space-y-4">
              {[...stats.rows]
                .sort((a, b) => b.pct - a.pct)
                .map((r) => (
                  <li key={r.habit.id}>
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate font-medium">{r.habit.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.count}/{stats.elapsed} ngày · chuỗi {r.streak} · dài nhất {r.best}
                      </span>
                    </div>
                    <Progress
                      value={r.pct}
                      aria-label={`${r.habit.name}: ${r.pct}%`}
                      className="mt-2 [&_[data-slot=progress-indicator]]:bg-(--lane) [&_[data-slot=progress-track]]:h-1.5"
                      style={{ "--lane": tone(r.pct) } as React.CSSProperties}
                    />
                  </li>
                ))}
            </ul>
          )}
        </Card>
        <Card title="Quản lý thói quen">
          <HabitManager month={month} habits={stats.rows.map((r) => r.habit)} />
        </Card>
      </div>
    </div>
  );
}
