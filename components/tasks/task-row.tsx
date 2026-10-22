import { deadlineLabel } from "@/lib/today";
import { daysBetween, formatDay } from "@/lib/date";
import type { Task } from "@/lib/notion/types";

const PRIORITY_CLASS: Record<string, string> = {
  Cao: "bg-danger-soft text-danger",
  Vừa: "bg-accent-soft text-accent",
  Thấp: "bg-surface-muted text-muted",
};

export function TaskCheckbox({ task, onComplete }: { task: Task; onComplete: (t: Task) => void }) {
  const done = task.status === "Xong";
  return (
    <input
      type="checkbox"
      checked={done}
      disabled={done}
      onChange={() => onComplete(task)}
      aria-label={done ? `${task.title} đã xong` : `Đánh dấu xong: ${task.title}`}
      className="mt-1 size-4 shrink-0 cursor-pointer accent-[var(--accent)] disabled:cursor-default"
    />
  );
}

export function TaskRow({
  task,
  today,
  onComplete,
  onEdit,
  showProject = false,
}: {
  task: Task;
  today: string;
  onComplete?: (t: Task) => void;
  onEdit?: () => void;
  showProject?: boolean;
}) {
  const done = task.status === "Xong";
  const daysLeft = task.deadline ? daysBetween(today, task.deadline) : null;
  const overdue = !done && daysLeft !== null && daysLeft < 0;

  return (
    <li className="group flex gap-3 py-2.5 first:pt-0 last:pb-0">
      {onComplete && <TaskCheckbox task={task} onComplete={onComplete} />}
      <div className="min-w-0 flex-1">
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:text-accent ${done ? "text-muted line-through" : overdue ? "text-danger" : ""}`}
        >
          {task.title || "(Chưa đặt tên)"}
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          {task.priority && (
            <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_CLASS[task.priority] ?? ""}`}>
              {task.priority}
            </span>
          )}
          {showProject && task.project && <span>{task.project}</span>}
          {task.deadline && daysLeft !== null && (
            <span className={overdue ? "font-medium text-danger" : daysLeft === 0 && !done ? "font-medium text-accent" : ""}>
              {done ? formatDay(task.deadline) : `${deadlineLabel(daysLeft)} · ${formatDay(task.deadline, true)}`}
            </span>
          )}
          {task.status === "Đang làm" && <span className="font-medium text-accent">Đang làm</span>}
          {task.note && <span className="truncate">{task.note}</span>}
        </div>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Sửa: ${task.title}`}
          title="Sửa"
          className="size-7 shrink-0 rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
        >
          ✎
        </button>
      )}
    </li>
  );
}

export function ErrorNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Đóng thông báo" className="shrink-0 font-medium">
        ✕
      </button>
    </div>
  );
}
