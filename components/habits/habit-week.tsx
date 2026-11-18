"use client";

import { ChevronRightIcon } from "lucide-react";
import { Card } from "@/components/card";
import { ErrorNotice } from "@/components/error-notice";
import { habitsForMonth, rangeStats } from "@/lib/habits";
import type { Habit } from "@/lib/types";
import { HabitManager } from "./habit-manager";
import { HabitTable } from "./habit-table";
import { useHabitDays } from "./use-habit-days";

/**
 * Thói quen của một tuần: bảng 7 ngày tích được + quản lý thu gọn bên dưới (SPEC.md mục 5.3, Trung chốt 19/11/2026).
 * `month`: tháng mà thêm / ngừng / đổi thứ tự áp vào (tháng có hôm nay nếu tuần có hôm nay, không thì tháng của thứ Hai).
 */
export function HabitWeek({
  title,
  days,
  month,
  today,
  habits,
  doneByDay,
}: {
  title: string;
  days: string[];
  month: string;
  today: string;
  habits: Habit[];
  doneByDay: Record<string, string[]>;
}) {
  const { days: done, toggle, error, dismissError } = useHabitDays(doneByDay);
  const stats = rangeStats(habits, done, days, today);
  const manager = <HabitManager month={month} habits={habitsForMonth(habits, month)} />;

  return (
    <Card title={title} action={<span className="text-sm text-muted-foreground">{stats.elapsed} ngày đã qua</span>}>
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}
      {stats.rows.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Chưa có thói quen nào trong tuần này.</p>
          {manager}
        </div>
      ) : (
        <>
          <HabitTable stats={stats} today={today} toggle={toggle} />
          <details className="group mt-4 border-t border-line pt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              <ChevronRightIcon aria-hidden="true" className="size-4 transition-transform group-open:rotate-90" />
              Quản lý thói quen
            </summary>
            <div className="mt-3">{manager}</div>
          </details>
        </>
      )}
    </Card>
  );
}
