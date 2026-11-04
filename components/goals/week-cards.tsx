"use client";

import { MaybeLink } from "@/components/tasks/maybe-link";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Empty } from "@/components/card";
import { Badge } from "@/components/reui/badge";
import { ErrorNotice, TaskCheckbox } from "@/components/tasks/task-row";
import { usePlanTasks } from "@/components/tasks/use-plan-tasks";
import { addDays, formatDay } from "@/lib/date";
import type { DailyLog, Task } from "@/lib/notion/types";
import { weekDayCards } from "@/lib/week-days";

const WEEKDAY = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];
const SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/**
 * 7 thẻ ngày (SPEC-v0.5 4.3): task Notion theo Ngày làm / Ngày xong / Hạn + Daily Log của tuần đang xem.
 * Tích xong và "Dời sang…" (đổi Ngày làm) ngay trên thẻ.
 */
export function WeekCards({ weekStart, today, tasks: initial, logs }: { weekStart: string; today: string; tasks: Task[]; logs: DailyLog[] }) {
  const { tasks, complete, plan, error, dismissError } = usePlanTasks(initial);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const cards = weekDayCards(weekStart, tasks, logs);
  const empty = cards.every((c) => c.total === 0 && !c.log);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-3">
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}
      {empty && <Empty>Tuần này chưa có task nào có Ngày làm hay Hạn, chưa có ghi chú ngày nào. Đặt Ngày làm ở Tasks hoặc Today.</Empty>}
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map((c, i) => {
          const isToday = c.date === today;
          const expanded = open[c.date] ?? isToday; // mobile: hôm nay mở sẵn
          return (
            <section
              key={c.date}
              aria-label={`${WEEKDAY[i]} ${formatDay(c.date, true)}`}
              className={`min-w-0 rounded-2xl border bg-surface p-3 ${isToday ? "border-primary" : "border-line"}`}
            >
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [c.date]: !expanded }))}
                aria-expanded={expanded}
                className="flex w-full items-center gap-2 text-left md:pointer-events-none"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-base font-semibold">{WEEKDAY[i]}</h3>
                    {c.pct === null ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : c.date > today && c.doneCount === 0 ? (
                      // ngày chưa tới: số việc đã xếp, không tô đỏ như bị trễ
                      <Badge variant="outline" size="sm" className="tabular-nums" title={`${c.total} việc đã xếp`}>
                        0/{c.total}
                      </Badge>
                    ) : (
                      <Badge variant={c.pct >= 70 ? "success-light" : c.pct >= 40 ? "warning-light" : "destructive-light"} size="sm" className="tabular-nums">
                        {c.pct}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDay(c.date, true)}</p>
                  {isToday && (
                    <Badge variant="primary-light" size="xs" className="mt-1">
                      Hôm nay
                    </Badge>
                  )}
                </div>
                <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform md:hidden ${expanded ? "rotate-180" : ""}`} />
              </button>
              <div className={`mt-3 space-y-3 text-sm ${expanded ? "" : "hidden"} md:block`}>
                {c.tasks.length === 0 && !c.log && <p className="text-xs text-muted-foreground">Trống.</p>}
                {c.tasks.length > 0 && (
                  <ul className="space-y-2.5">
                    {c.tasks.map((t) => {
                      const done = t.status === "Xong";
                      return (
                        <li key={t.id} className="space-y-1">
                          <div className="flex gap-2">
                            <TaskCheckbox task={t} onComplete={complete} />
                            <MaybeLink
                              href={t.url}
                              className={`min-w-0 break-words hover:text-primary ${done ? "text-muted-foreground line-through" : ""}`}
                            >
                              {t.title || "(Chưa đặt tên)"}
                            </MaybeLink>
                          </div>
                          {!done && (
                            <div className="flex flex-wrap items-center gap-1.5 pl-6">
                              {t.dueOnly && (
                                <Badge variant="destructive-light" size="xs">
                                  hạn
                                </Badge>
                              )}
                              <select
                                aria-label={`Dời “${t.title}” sang ngày khác`}
                                value=""
                                onChange={(e) => plan(t, e.target.value === "none" ? null : e.target.value)}
                                className="max-w-full rounded-md border border-line bg-surface px-1.5 py-0.5 text-xs text-muted-foreground hover:border-primary"
                              >
                                <option value="" disabled>
                                  Dời sang…
                                </option>
                                {days.map((d, k) =>
                                  d === t.plannedOn ? null : (
                                    <option key={d} value={d}>
                                      {SHORT[k]} {formatDay(d, true)}
                                    </option>
                                  ),
                                )}
                                {t.plannedOn && <option value="none">Bỏ lịch</option>}
                              </select>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {c.log && (
                  <div className="space-y-1 border-t border-line pt-2 text-xs text-muted-foreground">
                    {c.log.done && (
                      <p className="whitespace-pre-line">
                        <span className="font-medium text-foreground">Xong:</span> {c.log.done}
                      </p>
                    )}
                    {c.log.dropped && (
                      <p className="whitespace-pre-line">
                        <span className="font-medium text-foreground">Rơi:</span> {c.log.dropped}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
