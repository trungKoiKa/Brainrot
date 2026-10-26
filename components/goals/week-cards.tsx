"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Empty } from "@/components/card";
import { TaskCheckbox } from "@/components/tasks/task-row";
import { useTaskCompletion } from "@/components/tasks/use-task-completion";
import { formatDay } from "@/lib/date";
import type { DailyLog, Task } from "@/lib/notion/types";
import { weekDayCards, type PlannerSlotItem } from "@/lib/week-days";
import type { Day } from "@/features/planner/types";
import { selectWeekStart, usePlanner } from "@/features/planner/store/usePlanner";

const WEEKDAY = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];

/**
 * 7 thẻ ngày (SPEC-v0.4 mục 6.3): chỉ đọc task Notion, ô Planner và Daily Log của tuần đang xem.
 * Ô Planner chỉ có khi tuần đang lập kế hoạch trong Planner trùng tuần này.
 */
export function WeekCards({ weekStart, today, tasks, logs }: { weekStart: string; today: string; tasks: Task[]; logs: DailyLog[] }) {
  const { tasks: liveTasks, complete, error, dismissError } = useTaskCompletion(tasks);
  const projects = usePlanner((s) => s.projects);
  const plannerWeek = usePlanner(selectWeekStart);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const slotsByDay = useMemo(() => {
    const out: Partial<Record<Day, PlannerSlotItem[]>> = {};
    if (plannerWeek !== weekStart) return out;
    for (const p of projects)
      for (const t of p.tasks)
        for (const s of t.slots) (out[s.day] ??= []).push({ id: s.id, title: s.desc.trim() || t.title || "(Chưa đặt tên)", done: s.done });
    return out;
  }, [projects, plannerWeek, weekStart]);

  const cards = weekDayCards(weekStart, liveTasks, logs, slotsByDay);
  const empty = cards.every((c) => c.total === 0 && !c.log);

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
          <button type="button" onClick={dismissError} className="underline">
            Đóng
          </button>
        </p>
      )}
      {empty && <Empty>Tuần này chưa có task có hạn, ô Planner hay ghi chú ngày nào.</Empty>}
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map((c, i) => {
          const isToday = c.date === today;
          const expanded = open[c.date] ?? isToday; // mobile: hôm nay mở sẵn
          return (
            <section
              key={c.date}
              aria-label={`${WEEKDAY[i]} ${formatDay(c.date, true)}`}
              className={`rounded-2xl border bg-surface p-3 ${isToday ? "border-primary" : "border-line"}`}
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
                    <span className="text-sm font-medium tabular-nums">{c.pct === null ? "—" : `${c.pct}%`}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDay(c.date, true)}
                    {isToday && " · hôm nay"}
                  </p>
                </div>
                <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform md:hidden ${expanded ? "rotate-180" : ""}`} />
              </button>
              <div className={`mt-3 space-y-3 text-sm ${expanded ? "" : "hidden"} md:block`}>
                {c.tasks.length === 0 && c.slots.length === 0 && !c.log && <p className="text-xs text-muted-foreground">Trống.</p>}
                {c.tasks.length > 0 && (
                  <ul className="space-y-1.5">
                    {c.tasks.map((t) => (
                      <li key={t.id} className="flex gap-2">
                        <TaskCheckbox task={t} onComplete={complete} />
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`min-w-0 break-words hover:text-primary ${t.status === "Xong" ? "text-muted-foreground line-through" : ""}`}
                        >
                          {t.title || "(Chưa đặt tên)"}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {c.slots.length > 0 && (
                  <ul className="space-y-1.5 border-t border-line pt-2">
                    {c.slots.map((s) => (
                      <li key={s.id} className={`break-words ${s.done ? "text-muted-foreground line-through" : ""}`}>
                        <span aria-hidden>{s.done ? "✓" : "○"}</span> {s.title}
                      </li>
                    ))}
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
