"use client";

import { CircleAlertIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { MaybeLink } from "@/components/tasks/maybe-link";
import { Pill, ProjectPill, StatusPill } from "@/components/pill";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { daysBetween, formatDay, weekdayShort } from "@/lib/date";
import type { Task } from "@/lib/types";

/**
 * Ô tích xong (Checkbox thư viện). Có `onReopen` → việc đã xong bỏ tích được (về Chưa làm, SPEC-v1.0 07/11/2026);
 * không có → việc đã xong khoá ô.
 */
export function TaskCheckbox({
  task,
  onComplete,
  onReopen,
}: {
  task: Task;
  onComplete?: (t: Task) => void;
  onReopen?: (t: Task) => void;
}) {
  const done = task.status === "Xong";
  const locked = done ? !onReopen : !onComplete;
  return (
    <span className="flex h-5 shrink-0 items-center">
      <Checkbox
        checked={done}
        disabled={locked}
        onCheckedChange={() => (done ? onReopen?.(task) : onComplete?.(task))}
        aria-label={done ? (onReopen ? `Bỏ đánh dấu xong: ${task.title}` : `${task.title} đã xong`) : `Đánh dấu xong: ${task.title}`}
      />
    </span>
  );
}

/** Pill + nhãn mono của một việc theo bảng trạng thái chung (DESIGN.md → Pill). */
function TaskTags({ task, today, projects }: { task: Task; today: string; projects?: readonly string[] }) {
  const done = task.status === "Xong";
  const daysLeft = task.deadline ? daysBetween(today, task.deadline) : null;
  return (
    <>
      {projects && <ProjectPill project={task.project} projects={projects} />}
      {task.priority && !done && <Pill color="var(--muted-foreground)">{task.priority === "Cao" ? "ưu tiên cao" : task.priority === "Vừa" ? "ưu tiên vừa" : "ưu tiên thấp"}</Pill>}
      {task.status === "Đang làm" && <StatusPill tone="primary">đang làm</StatusPill>}
      {done && <StatusPill tone="success">xong</StatusPill>}
      {!done && daysLeft !== null && daysLeft < 0 && <StatusPill tone="danger">quá {-daysLeft} ngày</StatusPill>}
      {!done && daysLeft === 0 && <StatusPill tone="danger">hạn hôm nay</StatusPill>}
      {task.deadline && daysLeft !== null && daysLeft > 0 && !done && (
        <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
          hạn {formatDay(task.deadline, true)} · {daysLeft}n
        </span>
      )}
      {done && task.doneOn && <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">xong {formatDay(task.doneOn, true)}</span>}
      {task.plannedOn && !done && (
        <span className={`font-mono text-xs whitespace-nowrap ${task.plannedOn < today ? "text-warning" : task.plannedOn === today ? "text-primary" : "text-muted-foreground"}`}>
          làm {weekdayShort(task.plannedOn)} {formatDay(task.plannedOn, true)}
        </span>
      )}
    </>
  );
}

export function TaskRow({
  task,
  today,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
  projects,
}: {
  task: Task;
  today: string;
  onComplete?: (t: Task) => void;
  /** Việc đã xong: bỏ tích → về Chưa làm */
  onReopen?: (t: Task) => void;
  onEdit?: () => void;
  /** Có → hiện nút thùng rác; xoá ngay, toast "Hoàn tác" (SPEC-v1.0, Tasks đợt 3). */
  onDelete?: (t: Task) => void;
  /** Có → hiện pill dự án (danh sách không nhóm theo dự án, vd. "Đã xong"). */
  projects?: readonly string[];
}) {
  const done = task.status === "Xong";
  const overdue = !done && task.deadline !== null && task.deadline < today;
  const tags = <TaskTags task={task} today={today} projects={projects} />;

  return (
    <li className="flex items-start gap-3 border-b border-line px-4 py-2.5 last:border-b-0" data-task-id={task.id}>
      {(onComplete || onReopen) && <TaskCheckbox task={task} onComplete={onComplete} onReopen={onReopen} />}
      <div className="min-w-0 flex-1">
        <MaybeLink
          href={task.url}
          className={`text-sm break-words ${task.url ? "hover:text-primary" : ""} ${done ? "text-muted-foreground line-through" : overdue ? "text-danger" : ""}`}
        >
          {task.title || "(Chưa đặt tên)"}
        </MaybeLink>
        {task.note && <p className="mt-0.5 truncate text-xs text-muted-foreground" title={task.note}>{task.note}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 lg:hidden">{tags}</div>
      </div>
      <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 lg:flex">{tags}</div>
      {(onEdit || onDelete) && (
        <div className="-my-1 flex shrink-0 items-center gap-0.5">
          {onEdit && (
            <Button variant="ghost" size="icon" className="max-md:size-10" onClick={onEdit} aria-label={`Sửa: ${task.title}`} title="Sửa">
              <PencilIcon aria-hidden="true" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="max-md:size-10 hover:text-danger"
              onClick={() => onDelete(task)}
              aria-label={`Xóa: ${task.title}`}
              title="Xóa"
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function ErrorNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Lỗi khi lưu</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="icon-xs" onClick={onDismiss} aria-label="Đóng thông báo">
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
