"use client";

import { useOptimistic, useState, useTransition } from "react";
import { completeTask, deleteTaskAction, reopenTaskAction, restoreTaskAction } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";

type Change = { type: "done" | "reopen" | "delete"; id: string } | { type: "restore"; task: Task };

/**
 * Tích "xong" / bỏ tích / xóa task: đổi UI ngay (optimistic), gọi Server Action, rồi Next tải lại dữ liệu mới.
 * Nếu ghi lỗi, useOptimistic tự quay về danh sách cũ khi transition kết thúc → chỉ cần báo lỗi.
 */
export function useTaskCompletion(tasks: Task[]) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticTasks, apply] = useOptimistic(tasks, (state, change: Change) =>
    change.type === "restore" ? [...state, change.task] :
    change.type === "delete"
      ? state.filter((t) => t.id !== change.id)
      : state.map((t) =>
          t.id === change.id
            ? change.type === "done"
              ? { ...t, status: "Xong" as const }
              : { ...t, status: "Chưa làm" as const, doneOn: null }
            : t,
        ),
  );

  function complete(task: Task) {
    setError(null);
    startTransition(async () => {
      apply({ type: "done", id: task.id });
      const res = await completeTask(task.id);
      if (!res.ok) setError(`Chưa đánh dấu xong “${task.title}”. ${res.error}`);
    });
  }

  /** Hoàn tác tích xong / bỏ tích trong "Đã xong" (SPEC-v1.0, 07/11/2026): về Chưa làm. */
  function reopen(task: Task) {
    setError(null);
    startTransition(async () => {
      apply({ type: "reopen", id: task.id });
      const res = await reopenTaskAction(task.id);
      if (!res.ok) setError(`Chưa mở lại được “${task.title}”. ${res.error}`);
    });
  }

  /** Xóa hẳn (SPEC-v1.0, 05/11/2026) — dòng task đã hỏi xác nhận trước khi gọi. */
  function remove(task: Task) {
    setError(null);
    startTransition(async () => {
      apply({ type: "delete", id: task.id });
      const res = await deleteTaskAction(task.id);
      if (!res.ok) setError(`Chưa xóa được “${task.title}”. ${res.error}`);
    });
  }

  /** Hoàn tác xoá (SPEC-v1.0, Tasks đợt 3): chèn lại đúng id từ ảnh chụp task. */
  function restore(task: Task) {
    setError(null);
    startTransition(async () => {
      apply({ type: "restore", task });
      const res = await restoreTaskAction({
        id: task.id,
        title: task.title,
        project: task.project,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        plannedOn: task.plannedOn,
        doneOn: task.doneOn,
        note: task.note,
        createdTime: task.createdTime,
        goalIds: task.goalIds,
      });
      if (!res.ok) setError(`Chưa hoàn tác được việc “${task.title}”. ${res.error}`);
    });
  }

  return { tasks: optimisticTasks, complete, reopen, remove, restore, error, dismissError: () => setError(null) };
}
