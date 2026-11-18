"use client";

import { Card } from "@/components/card";
import { ErrorNotice } from "@/components/error-notice";
import { Progress } from "@/components/ui/progress";
import { habitTone as tone, monthStats } from "@/lib/habits";
import { monthLabel } from "@/lib/period";
import type { Habit } from "@/lib/types";
import { HabitManager } from "./habit-manager";
import { HabitTable } from "./habit-table";
import { useHabitDays } from "./use-habit-days";

/** Bảng thói quen × ngày của một tháng (SPEC.md mục 5.3). */
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

  return (
    <div className="space-y-5">
      <Card title={`Thói quen · ${monthLabel(month).toLowerCase()}`} action={<span className="text-sm text-muted-foreground">{stats.elapsed} ngày đã qua</span>}>
        {error && <ErrorNotice message={error} onDismiss={dismissError} />}
        {stats.rows.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Chưa có thói quen nào trong tháng này.</p>
            <HabitManager month={month} habits={[]} />
          </div>
        ) : (
          <HabitTable stats={stats} today={today} toggle={toggle} />
        )}
      </Card>

      {stats.rows.length > 0 && (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                        {r.count}/{r.tracked} ngày · chuỗi {r.streak} · dài nhất {r.best}
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
      )}
    </div>
  );
}
