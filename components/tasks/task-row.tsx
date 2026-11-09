"use client";

import { useEffect, useRef, useState } from "react";
import { MaybeLink } from "@/components/tasks/maybe-link";
import { CircleAlertIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { deadlineLabel } from "@/lib/today";
import { daysBetween, formatDay, weekdayShort } from "@/lib/date";
import type { Task } from "@/lib/types";

// Ưu tiên là phân loại, không phải cảnh báo → màu trung tính; đỏ dành cho quá hạn (critique Tasks 07/11/2026)
const PRIORITY_CLASS: Record<string, string> = {
  Cao: "border border-line font-semibold text-foreground",
  Vừa: "border border-line text-muted-foreground",
  Thấp: "text-muted-foreground",
};

const iconButton =
  "grid size-10 md:size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Ô tích xong. Có `onReopen` → việc đã xong bỏ tích được (về Chưa làm, SPEC-v1.0 07/11/2026);
 * không có → việc đã xong khoá ô (Today giữ nguyên hành vi cũ).
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
    <label className="-m-3 shrink-0 cursor-pointer p-3 md:-m-2 md:p-2">
    <input
      type="checkbox"
      checked={done}
      disabled={locked}
      onChange={() => (done ? onReopen?.(task) : onComplete?.(task))}
      aria-label={done ? (onReopen ? `Bỏ đánh dấu xong: ${task.title}` : `${task.title} đã xong`) : `Đánh dấu xong: ${task.title}`}
      className="mt-1 block size-4 cursor-pointer accent-[var(--primary)] disabled:cursor-default"
    />
    </label>
  );
}

export function TaskRow({
  task,
  today,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
  showProject = false,
}: {
  task: Task;
  today: string;
  onComplete?: (t: Task) => void;
  /** Việc đã xong: bỏ tích → về Chưa làm */
  onReopen?: (t: Task) => void;
  onEdit?: () => void;
  /** Có → hiện icon thùng rác; bấm hỏi xác nhận ngay tại dòng rồi mới gọi (xóa hẳn, SPEC-v1.0). */
  onDelete?: (t: Task) => void;
  showProject?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const trashRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  // Huỷ xác nhận → trả con trỏ về nút thùng rác (không rơi về đầu trang)
  useEffect(() => {
    if (wasConfirming.current && !confirming) trashRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const done = task.status === "Xong";
  const daysLeft = task.deadline ? daysBetween(today, task.deadline) : null;
  const overdue = !done && daysLeft !== null && daysLeft < 0;

  return (
    <li className="group flex flex-wrap gap-x-3 py-2.5 first:pt-0 last:pb-0" data-task-id={task.id}>
      {(onComplete || onReopen) && <TaskCheckbox task={task} onComplete={onComplete} onReopen={onReopen} />}
      <div className="min-w-0 flex-1">
        <MaybeLink
          href={task.url}
          className={`break-words ${task.url ? "hover:text-primary" : ""} ${done ? "text-muted-foreground line-through" : overdue ? "text-danger" : ""}`}
        >
          {task.title || "(Chưa đặt tên)"}
        </MaybeLink>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.priority && !done && (
            <span className={`rounded-full px-2 py-0.5 ${PRIORITY_CLASS[task.priority] ?? ""}`}>{task.priority}</span>
          )}
          {showProject && task.project && <span>{task.project}</span>}
          {task.deadline && daysLeft !== null && (
            <span className={overdue ? "font-medium text-danger" : daysLeft === 0 && !done ? "font-medium text-primary" : ""}>
              {done ? formatDay(task.deadline) : `${deadlineLabel(daysLeft)} · ${formatDay(task.deadline, true)}`}
            </span>
          )}
          {task.plannedOn && !done && (
            <span className={task.plannedOn < today ? "text-danger" : task.plannedOn === today ? "font-medium text-primary" : ""}>
              Làm: {weekdayShort(task.plannedOn)} {formatDay(task.plannedOn, true)}
            </span>
          )}
          {task.status === "Đang làm" && <span className="font-medium text-primary">Đang làm</span>}
          {task.note && <span className="truncate">{task.note}</span>}
        </div>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Sửa: ${task.title}`}
          title="Sửa"
          className={`${iconButton} hover:bg-surface-muted hover:text-foreground`}
        >
          <PencilIcon className="size-4" aria-hidden="true" />
        </button>
      )}
      {onDelete &&
        (confirming ? (
          <div
            role="group"
            aria-label={`Xác nhận xóa: ${task.title}`}
            className="flex w-full shrink-0 items-center justify-end gap-1 pt-1 text-xs"
            onKeyDown={(e) => e.key === "Escape" && setConfirming(false)}
          >
            <span className="text-muted-foreground">Xóa hẳn?</span>
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="rounded-md px-2 py-1 font-medium text-danger transition-colors outline-none hover:bg-danger-soft focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Xóa
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => setConfirming(false)}
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors outline-none hover:bg-surface-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            ref={trashRef}
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Xóa: ${task.title}`}
            title="Xóa"
            className={`${iconButton} hover:bg-danger-soft hover:text-danger`}
          >
            <Trash2Icon className="size-4" aria-hidden="true" />
          </button>
        ))}
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
