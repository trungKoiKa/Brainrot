"use client";

import { useOptimistic, useState, useTransition } from "react";
import { completeTask, deleteTaskAction } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";

type Change = { type: "done" | "delete"; id: string };

/**
 * Tích "xong" / xóa task: đổi UI ngay (optimistic), gọi Server Action, rồi Next tải lại dữ liệu mới.
 * Nếu ghi lỗi, useOptimistic tự quay về danh sách cũ khi transition kết thúc → chỉ cần báo lỗi.
 */
export function useTaskCompletion(tasks: Task[]) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticTasks, apply] = useOptimistic(tasks, (state, change: Change) =>
    change.type === "delete"
      ? state.filter((t) => t.id !== change.id)
      : state.map((t) => (t.id === change.id ? { ...t, status: "Xong" as const } : t)),
  );

  function complete(task: Task) {
    setError(null);
    startTransition(async () => {
      apply({ type: "done", id: task.id });
      const res = await completeTask(task.id);
      if (!res.ok) setError(`Chưa đánh dấu xong “${task.title}”. ${res.error}`);
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

  return { tasks: optimisticTasks, complete, remove, error, dismissError: () => setError(null) };
}
