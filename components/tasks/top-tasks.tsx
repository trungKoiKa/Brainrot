"use client";

import type { Task } from "@/lib/notion/types";
import { ErrorNotice, TaskCheckbox } from "./task-row";
import { useTaskCompletion } from "./use-task-completion";

/** Khối "3 việc hôm nay" khi lấy từ Tasks: có nút tích xong (SPEC 7.1). */
export function TopTasks({ tasks: initial }: { tasks: Task[] }) {
  const { tasks, complete, error, dismissError } = useTaskCompletion(initial);

  return (
    <>
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}
      <ol className="space-y-2">
        {tasks.map((task) => {
          const done = task.status === "Xong";
          return (
            <li key={task.id} className="flex gap-3">
              <TaskCheckbox task={task} onComplete={complete} />
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:text-accent ${done ? "text-muted line-through" : ""}`}
              >
                {task.title || "(Chưa đặt tên)"}
                {task.project && <span className="ml-2 text-xs text-muted no-underline">{task.project}</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </>
  );
}
