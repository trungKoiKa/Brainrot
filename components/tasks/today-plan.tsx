"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { createTaskAction, type TaskFormState } from "@/app/actions/tasks";
import { toast } from "sonner";
import { MaybeLink } from "@/components/tasks/maybe-link";
import { Empty } from "@/components/card";
import { ProjectPill, StatusPill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { addDays, daysBetween, formatDay, weekdayShort } from "@/lib/date";
import type { Task } from "@/lib/types";
import { planToday, todayEmptyKind, tomorrowCandidates, type TodayEmptyKind } from "@/lib/today";
import { ErrorNotice } from "./task-row";
import { usePlanTasks } from "./use-plan-tasks";

const dayLabel = (day: string) => `${weekdayShort(day)} ${formatDay(day, true)}`;

type RowState = "late" | "due" | "plan" | "suggest";

/**
 * Một dòng việc kiểu "nhật ký kỹ thuật" (DESIGN.md → Bảng việc): số thứ tự mono · ô tích · tên · pill.
 * Dưới md pill xuống dòng dưới tên để tên không bị bóp (rà soát 11/2026, P0). Việc vừa tích ở lại, gạch ngang.
 */
function Row({
  n,
  task,
  state,
  today,
  projects,
  onToggle,
  onPlan,
}: {
  n: number;
  task: Task;
  state: RowState;
  today: string;
  projects: readonly string[];
  onToggle: (t: Task) => void;
  onPlan: (t: Task) => void;
}) {
  const done = task.status === "Xong";
  const late = state === "late" && task.plannedOn ? daysBetween(task.plannedOn, today) : 0;
  const tags = (
    <>
      <ProjectPill project={task.project} projects={projects} />
      {done ? (
        <StatusPill tone="success">xong</StatusPill>
      ) : (
        <>
          {state === "late" && <StatusPill tone="warning">trễ {late} ngày</StatusPill>}
          {task.deadline && task.deadline < today && <StatusPill tone="danger">quá {daysBetween(task.deadline, today)} ngày</StatusPill>}
          {(state === "due" || (state === "plan" && task.deadline === today)) && <StatusPill tone="danger">hạn hôm nay</StatusPill>}
          {state === "plan" && task.deadline && task.deadline !== today && (
            <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">hạn {formatDay(task.deadline, true)}</span>
          )}
          {state !== "plan" && (
            <Button variant="outline" size="xs" className="rounded-full" onClick={() => onPlan(task)}>
              Làm hôm nay
            </Button>
          )}
        </>
      )}
    </>
  );
  return (
    <li className="flex items-start gap-3 border-b border-line px-4 py-2.5 last:border-b-0" data-task-id={task.id}>
      <span aria-hidden="true" className="w-5 pt-0.5 font-mono text-xs text-muted-foreground">
        {String(n).padStart(2, "0")}
      </span>
      <span className="flex h-5 items-center">
        <Checkbox
          checked={done}
          onCheckedChange={() => onToggle(task)}
          aria-label={done ? `Bỏ đánh dấu xong: ${task.title}` : `Đánh dấu xong: ${task.title}`}
        />
      </span>
      <div className="min-w-0 flex-1">
        <MaybeLink href={task.url} className={`text-sm break-words ${done ? "text-muted-foreground line-through" : "hover:text-primary"}`}>
          {task.title || "(Chưa đặt tên)"}
        </MaybeLink>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">{tags}</div>
      </div>
      <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 md:flex">{tags}</div>
    </li>
  );
}

const EMPTY_TEXT: Record<TodayEmptyKind, { text: string; link: string }> = {
  "no-tasks": { text: "Chưa có việc nào. Thêm việc đầu tiên ở ô bên dưới.", link: "" },
  "all-done": { text: "Xong hết rồi, không còn việc nào. Thêm việc mới ở ô bên dưới.", link: "" },
  "scheduled-later": { text: "Hôm nay chưa xếp việc nào; các việc còn lại đã có lịch ngày khác.", link: "Xem ở Tasks" },
};

/** "Hôm nay làm" trống: nói đúng lý do và chỉ đường sang Tasks (SPEC-v1.0 "Người mới"). */
function EmptyPlan({ kind }: { kind: TodayEmptyKind }) {
  const { text, link } = EMPTY_TEXT[kind];
  return (
    <p className="px-4 py-3 text-sm text-pretty text-muted-foreground">
      {text}{" "}
      {link && (
        <Link href="/tasks" className="font-medium text-primary underline-offset-4 hover:underline">
          {link}
        </Link>
      )}
    </p>
  );
}

/**
 * Khối "Hôm nay làm" trên Today (SPEC-v0.5 4.2): trễ · hạn hôm nay · Ngày làm hôm nay · gợi ý khi trống.
 * Redesign 11/2026 (P0): việc tích xong trong ngày ở nguyên chỗ, gạch ngang, bỏ tích được; toast có nút Hoàn tác.
 */
export function TodayPlan({ today, tasks: initial, projects }: { today: string; tasks: Task[]; projects: readonly string[] }) {
  const { tasks, complete, reopen, plan, error, dismissError } = usePlanTasks(initial);
  // Việc xong trong ngày (kể cả vừa tích) vẫn xếp vào nhóm cũ: coi như chưa xong khi chia nhóm, rồi vẽ theo trạng thái thật
  const doneToday = (t: Task) => t.status === "Xong" && (t.doneOn === today || initial.find((i) => i.id === t.id)?.status !== "Xong");
  const p = planToday(
    today,
    tasks.map((t) => (doneToday(t) ? { ...t, status: null } : t)),
  );
  const shown = (t: Task) => tasks.find((x) => x.id === t.id) ?? t;

  function toggle(t: Task) {
    if (t.status === "Xong") {
      reopen(t);
      return;
    }
    complete(t);
    toast(`Đã xong “${t.title || "(Chưa đặt tên)"}”`, { action: { label: "Hoàn tác", onClick: () => reopen(t) } });
  }
  const toToday = (t: Task) => plan(t, today);

  const rows: { task: Task; state: RowState }[] = [
    ...p.late.map((t) => ({ task: shown(t), state: "late" as const })),
    ...p.due.map((t) => ({ task: shown(t), state: "due" as const })),
    ...p.planned.map((t) => ({ task: shown(t), state: "plan" as const })),
  ];

  return (
    <div>
      {error && (
        <div className="px-4 pt-4">
          <ErrorNotice message={error} onDismiss={dismissError} />
        </div>
      )}
      {rows.length > 0 ? (
        <ul>
          {rows.map((r, i) => (
            <Row key={r.task.id} n={i + 1} {...r} today={today} projects={projects} onToggle={toggle} onPlan={toToday} />
          ))}
        </ul>
      ) : p.suggest.length === 0 ? (
        <EmptyPlan kind={todayEmptyKind(tasks)} />
      ) : (
        <>
          <p className="px-4 pt-3 text-sm text-muted-foreground">Chưa xếp việc nào cho hôm nay. Gợi ý:</p>
          <ul>
            {p.suggest.map((t, i) => (
              <Row key={t.id} n={i + 1} task={shown(t)} state="suggest" today={today} projects={projects} onToggle={toggle} onPlan={toToday} />
            ))}
          </ul>
        </>
      )}
      <div className="border-t border-line px-4 py-3">
        <TodayAdd today={today} />
      </div>
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
      <summary className="cursor-pointer py-2.5 text-sm font-medium">
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
                    <Checkbox className="mt-0.5" checked={on} onCheckedChange={() => plan(t, on ? null : tomorrow)} />
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
        {list.length > 0 && <p className="text-xs text-muted-foreground">Việc đã chọn sẽ hiện ở “Hôm nay làm” sáng mai.</p>}
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
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="plannedOn" value={today} />
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          name="title"
          aria-label="Thêm việc cho hôm nay"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="+ Thêm việc cho hôm nay…"
          autoComplete="off"
          className="min-w-0 flex-1"
        />
        <Button type="submit" disabled={pending || !title.trim()}>
          {pending ? "Đang thêm…" : "Thêm"}
        </Button>
      </div>
      <div role="status" aria-live="polite" className="text-xs text-muted-foreground empty:hidden">
        {state.message ? (state.ok ? state.message : <span className="text-(--danger)">{state.message}</span>) : ""}
      </div>
    </form>
  );
}
