"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { createTaskAction, type TaskFormState } from "@/app/actions/tasks";
import { fieldClass, primaryButtonClass } from "@/components/form-bits";
import { MaybeLink } from "@/components/tasks/maybe-link";
import { Empty } from "@/components/card";
import { Badge } from "@/components/reui/badge";
import { addDays, formatDay, weekdayShort } from "@/lib/date";
import type { Task } from "@/lib/types";
import { planToday, todayEmptyKind, tomorrowCandidates, type TodayEmptyKind } from "@/lib/today";
import { ErrorNotice, TaskCheckbox } from "./task-row";
import { usePlanTasks } from "./use-plan-tasks";

const dayLabel = (day: string) => `${weekdayShort(day)} ${formatDay(day, true)}`;

function Row({ task, onComplete, children }: { task: Task; onComplete: (t: Task) => void; children?: React.ReactNode }) {
  const done = task.status === "Xong";
  return (
    <li className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
      <TaskCheckbox task={task} onComplete={onComplete} />
      <div className="min-w-0 flex-1">
        <MaybeLink
          href={task.url}
          className={`break-words hover:text-primary ${done ? "text-muted-foreground line-through" : ""}`}
        >
          {task.title || "(Chưa đặt tên)"}
        </MaybeLink>
        {task.project && <span className="ml-2 text-xs text-muted-foreground">{task.project}</span>}
      </div>
      {children}
    </li>
  );
}

const smallButton =
  "shrink-0 rounded-md border border-line px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const EMPTY_TEXT: Record<TodayEmptyKind, { text: string; link: string }> = {
  "no-tasks": { text: "Chưa có việc nào.", link: "Tạo việc đầu tiên ở Tasks" },
  "all-done": { text: "Xong hết rồi, không còn việc nào.", link: "Thêm việc mới ở Tasks" },
  "scheduled-later": { text: "Hôm nay chưa xếp việc nào; các việc còn lại đã có lịch ngày khác.", link: "Xem ở Tasks" },
};

/** "Hôm nay làm" trống: nói đúng lý do và chỉ đường sang Tasks (SPEC-v1.0 "Người mới"). */
function EmptyPlan({ kind }: { kind: TodayEmptyKind }) {
  const { text, link } = EMPTY_TEXT[kind];
  return (
    <p className="text-sm text-pretty text-muted-foreground">
      {text}{" "}
      <Link href="/tasks" className="font-medium text-primary underline-offset-4 hover:underline">
        {link}
      </Link>
    </p>
  );
}

/** Khối "Hôm nay làm" trên Today (SPEC-v0.5 4.2): Ngày làm hôm nay · trễ · hạn hôm nay · gợi ý khi trống. */
export function TodayPlan({ today, tasks: initial }: { today: string; tasks: Task[] }) {
  const { tasks, complete, plan, error, dismissError } = usePlanTasks(initial);
  // Task vừa tích xong vẫn hiện (gạch ngang) tới lần tải lại, để thấy mình vừa làm gì
  const p = planToday(today, tasks.map((t) => (t.status === "Xong" && initial.find((i) => i.id === t.id)?.status !== "Xong" ? { ...t, status: null } : t)));
  const shown = (t: Task) => tasks.find((x) => x.id === t.id) ?? t;

  return (
    <div className="space-y-4">
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}

      {p.planned.length > 0 && (
        <ul className="divide-y divide-line">
          {p.planned.map((t) => (
            <Row key={t.id} task={shown(t)} onComplete={complete}>
              {t.deadline === today && <Badge variant="destructive-light" size="sm">hạn hôm nay</Badge>}
            </Row>
          ))}
        </ul>
      )}

      {p.late.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Trễ lịch</h3>
          <ul className="divide-y divide-line">
            {p.late.map((t) => (
              <Row key={t.id} task={shown(t)} onComplete={complete}>
                <Badge variant="warning-light" size="sm" className="shrink-0">
                  trễ từ {dayLabel(t.plannedOn)}
                </Badge>
                <button type="button" className={smallButton} onClick={() => plan(t, today)}>
                  Dời sang hôm nay
                </button>
              </Row>
            ))}
          </ul>
        </section>
      )}

      {p.due.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Hạn hôm nay</h3>
          <ul className="divide-y divide-line">
            {p.due.map((t) => (
              <Row key={t.id} task={shown(t)} onComplete={complete}>
                <button type="button" className={smallButton} onClick={() => plan(t, today)}>
                  Làm hôm nay
                </button>
              </Row>
            ))}
          </ul>
        </section>
      )}

      {p.planned.length + p.late.length + p.due.length === 0 &&
        (p.suggest.length === 0 ? (
          <EmptyPlan kind={todayEmptyKind(tasks)} />
        ) : (
          <section className="space-y-2">
            <Empty>Chưa xếp việc nào cho hôm nay. Gợi ý:</Empty>
            <ul className="divide-y divide-line">
              {p.suggest.map((t) => (
                <Row key={t.id} task={shown(t)} onComplete={complete}>
                  <button type="button" className={smallButton} onClick={() => plan(t, today)}>
                    Làm hôm nay
                  </button>
                </Row>
              ))}
            </ul>
          </section>
        ))}

      <TodayAdd today={today} />
    </div>
  );
}

/** "Ngày mai làm" trong Ghi nhanh (SPEC-v0.5 câu 10.2a): tích task → Ngày làm = ngày mai, bỏ tích → bỏ lịch. */
export function TomorrowPicker({
  today,
  tasks: initial,
  open = false,
}: {
  today: string;
  tasks: Task[];
  /** Mở sẵn (Today: sau 18:00). */
  open?: boolean;
}) {
  const { tasks, plan, error, dismissError } = usePlanTasks(initial);
  const tomorrow = addDays(today, 1);
  // Danh sách cố định theo dữ liệu server; trạng thái tích lấy từ bản optimistic
  const list = tomorrowCandidates(today, initial).map((t) => tasks.find((x) => x.id === t.id) ?? t);

  return (
    <details className="group" open={open}>
      <summary className="cursor-pointer rounded-md py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        Ngày mai làm{" "}
        <span className="font-normal text-muted-foreground">
          · {dayLabel(tomorrow)} · đã chọn {list.filter((t) => t.plannedOn === tomorrow).length}
        </span>
      </summary>
      <div className="mt-3 space-y-2">
        {error && <ErrorNotice message={error} onDismiss={dismissError} />}
        {list.length === 0 ? (
          <Empty>Không có task nào chưa xếp lịch.</Empty>
        ) : (
          <ul className="grid gap-x-6 gap-y-2 md:grid-cols-2">
            {list.map((t) => {
              const on = t.plannedOn === tomorrow;
              return (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => plan(t, on ? null : tomorrow)}
                      className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span className="min-w-0 break-words">
                      {t.title || "(Chưa đặt tên)"}
                      {t.priority && <span className="ml-2 text-xs text-muted-foreground">{t.priority}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">Việc đã chọn sẽ hiện ở “Hôm nay làm” sáng mai.</p>
      </div>
    </details>
  );
}

/**
 * Thêm việc thẳng vào hôm nay (SPEC-v1.0, Today đợt 3): chỉ cần tên, Ngày làm = ngày làm việc hiện tại.
 * Dự án, ưu tiên, deadline vẫn đặt ở Tasks.
 */
function TodayAdd({ today }: { today: string }) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(async (prev: TaskFormState, form: FormData) => {
    const next = await createTaskAction(prev, form);
    if (next.ok) {
      setTitle("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    return next;
  }, {});
  return (
    <form action={action} className="space-y-1.5 pt-1">
      <input type="hidden" name="plannedOn" value={today} />
      <div className="flex gap-2">
        <input
          ref={inputRef}
          name="title"
          aria-label="Thêm việc cho hôm nay"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thêm việc cho hôm nay…"
          autoComplete="off"
          className={`${fieldClass} min-w-0 flex-1`}
        />
        <button type="submit" disabled={pending || !title.trim()} className={primaryButtonClass}>
          {pending ? "Đang thêm…" : "Thêm"}
        </button>
      </div>
      <div role="status" aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {state.message ? (state.ok ? state.message : <span className="text-(--danger)">{state.message}</span>) : ""}
      </div>
    </form>
  );
}
