"use client";

import { useState } from "react";
import { CalendarDaysIcon, ChevronDownIcon } from "lucide-react";
import { Empty } from "@/components/card";
import { Badge } from "@/components/reui/badge";
import { StatusPill } from "@/components/pill";
import { TaskCheckbox } from "@/components/tasks/task-row";
import { ErrorNotice } from "@/components/error-notice";
import { usePlanTasks } from "@/components/tasks/use-plan-tasks";
import { addDays, formatDay } from "@/lib/date";
import type { DailyLog, Task } from "@/lib/types";
import { weekDayCards } from "@/lib/week-days";
import { undoToast } from "@/components/undo-toast";

const WEEKDAY = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];
const SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/**
 * 7 thẻ ngày (SPEC.md mục 5.3): task theo Ngày làm / Ngày xong / Hạn + Daily Log của tuần đang xem.
 * Tích xong và "Dời sang…" (đổi Ngày làm) ngay trên thẻ; dời xong có "Hoàn tác".
 */
export function WeekCards({
  weekStart,
  today,
  tasks: initial,
  logs,
  goalOfTask,
  trayIds,
}: {
  weekStart: string;
  today: string;
  tasks: Task[];
  logs: DailyLog[];
  /** id việc → tên mục tiêu (nhãn dưới tên việc) */
  goalOfTask: Record<string, string>;
  /** id việc gắn vào mục tiêu của tuần này (khay "Chưa xếp ngày") */
  trayIds: string[];
}) {
  const { tasks, complete, plan, error, dismissError } = usePlanTasks(initial);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [moving, setMoving] = useState<string | null>(null); // id task đang mở hàng chọn ngày

  const cards = weekDayCards(weekStart, tasks, logs);
  const empty = cards.every((c) => c.total === 0 && !c.log);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const tray = tasks.filter((t) => trayIds.includes(t.id) && t.status !== "Xong" && !t.plannedOn);

  // Dời ngày → toast "Hoàn tác" (sonner, xếp chồng; thay dải tự viết — rà soát 11/2026)
  function move(t: Task, to: string | null) {
    setMoving(null);
    const from = t.plannedOn;
    plan(t, to);
    undoToast(`Đã dời “${t.title || "(Chưa đặt tên)"}” sang ${where(to)}`, () => plan({ ...t, plannedOn: to }, from));
  }

  const where = (d: string | null) => {
    const i = d ? days.indexOf(d) : -1;
    return d === null ? "không còn lịch" : i >= 0 ? `${SHORT[i]} ${formatDay(d, true)}` : formatDay(d, true);
  };

  /** Một dòng việc (thẻ ngày và khay "Chưa xếp ngày"): tích xong, nhãn mục tiêu, nhãn hạn, Dời sang… */
  function renderTask(t: Task & { dueOnly?: boolean }, past: boolean) {
    const done = t.status === "Xong";
    // Chỉ cho dời sang hôm nay hoặc ngày sau đó (rà soát 11/2026 P2: không dời về ngày đã qua)
    const targets = days.filter((d) => d >= today && d !== t.plannedOn);
    const canMove = targets.length > 0 || t.plannedOn !== null;
    return (
      <li key={t.id} className="space-y-1">
        <div className="flex gap-2">
          <TaskCheckbox task={t} onComplete={complete} />
          <span className={`min-w-0 break-words ${done ? "text-muted-foreground line-through" : ""}`}>{t.title || "(Chưa đặt tên)"}</span>
        </div>
        {goalOfTask[t.id] && (
          <p className="pl-6 text-xs text-muted-foreground">
            <span className="sr-only">Mục tiêu: </span>
            {goalOfTask[t.id]}
          </p>
        )}
        {!done && (
          <div className="flex flex-wrap items-center gap-1.5 pl-6">
            {t.dueOnly && (
              // đỏ chỉ khi đã quá hạn; hạn hôm nay / sắp tới là nhãn trung tính
              past ? <StatusPill tone="danger">quá hạn</StatusPill> : <StatusPill tone="muted">hạn</StatusPill>
            )}
            {canMove && (
            <button
              type="button"
              aria-expanded={moving === t.id}
              aria-label={`Dời “${t.title}” sang ngày khác`}
              onClick={() => setMoving((m) => (m === t.id ? null : t.id))}
              className="inline-flex min-h-10 items-center gap-1 rounded-md border border-line px-2 py-0.5 text-xs text-muted-foreground md:min-h-0 md:px-1.5 outline-none hover:border-primary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
            >
              <CalendarDaysIcon aria-hidden="true" className="size-3" />
              Dời sang…
            </button>
            )}
            {moving === t.id && (
              <div role="group" aria-label={`Chọn ngày mới cho “${t.title}”`} className="flex w-full flex-wrap gap-1 pt-1">
                {targets.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => move(t, d)}
                    className="inline-flex min-h-10 items-center rounded-md border border-line px-2 py-0.5 text-xs tabular-nums md:min-h-0 md:px-1.5 outline-none hover:border-primary focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    {SHORT[days.indexOf(d)]} {formatDay(d, true)}
                  </button>
                ))}
                {t.plannedOn && (
                  <button
                    type="button"
                    onClick={() => move(t, null)}
                    className="inline-flex min-h-10 items-center rounded-md px-1.5 py-0.5 text-xs text-muted-foreground outline-none hover:text-foreground md:min-h-0 focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    Bỏ lịch
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-3">
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}
      {empty && <Empty>Tuần này chưa có task nào có Ngày làm hay Hạn, chưa có ghi chú ngày nào. Đặt Ngày làm ở Tasks hoặc Today.</Empty>}
      {tray.length > 0 && (
        <section aria-label="Chưa xếp ngày" className="rounded-lg border border-dashed border-line bg-surface p-3">
          <h3 className="font-serif text-base font-semibold">
            Chưa xếp ngày <span className="font-sans text-sm font-normal text-muted-foreground tabular-nums">({tray.length})</span>
          </h3>
          <p className="text-xs text-muted-foreground">Việc của mục tiêu tuần này chưa có Ngày làm.</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2.5 text-sm md:grid-cols-2 xl:grid-cols-3">{tray.map((t) => renderTask(t, false))}</ul>
        </section>
      )}
      {/* 4 cột thay 7: thẻ ngày đủ rộng cho tên việc ở 1440px (rà soát A1 P1) */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => {
          const isToday = c.date === today;
          const expanded = open[c.date] ?? isToday; // mobile: hôm nay mở sẵn
          const past = c.date < today;
          return (
            <section
              key={c.date}
              aria-label={`${WEEKDAY[i]} ${formatDay(c.date, true)}`}
              className={`min-w-0 rounded-xl border bg-surface p-3 ${isToday ? "border-primary" : "border-line"}`}
            >
              <div className="flex w-full items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{WEEKDAY[i]}</h3>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-muted-foreground">{formatDay(c.date, true)}</p>
                    {c.pct === null ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : !past ? (
                      // hôm nay / ngày chưa tới: chưa chốt → số xong/đã xếp, trung tính (không tô đỏ như bị trễ)
                      <Badge variant="outline" className="tabular-nums" title={`${c.doneCount}/${c.total} việc xong`}>
                        {c.doneCount}/{c.total}
                      </Badge>
                    ) : (
                      <Badge variant={c.pct >= 70 ? "success-light" : "outline"} className="tabular-nums">
                        {c.pct}%
                      </Badge>
                    )}
                  </div>
                  {isToday && (
                    <Badge variant="primary-light" className="mt-1">
                      Hôm nay
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [c.date]: !expanded }))}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Thu gọn" : "Mở"} ${WEEKDAY[i]}`}
                  className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring md:hidden"
                >
                  <ChevronDownIcon aria-hidden="true" className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
              </div>
              <div className={`mt-3 space-y-3 text-sm ${expanded ? "" : "hidden"} md:block`}>
                {c.tasks.length === 0 && !c.log && <p className="text-xs text-muted-foreground">Trống.</p>}
                {c.tasks.length > 0 && (
                  <ul className="space-y-2.5">
                    {c.tasks.map((t) => renderTask(t, past))}
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
                        <span className="font-medium text-foreground">Chưa xong:</span> {c.log.dropped}
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
