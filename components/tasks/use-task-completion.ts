"use client";

import { useOptimistic, useState, useTransition } from "react";
import { completeTask } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";

/**
 * Tích "xong": đổi UI ngay (optimistic), gọi Server Action, rồi Next tải lại dữ liệu mới.
 * Nếu ghi lỗi, useOptimistic tự quay về danh sách cũ khi transition kết thúc → chỉ cần báo lỗi.
 */
export function useTaskCompletion(tasks: Task[]) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticTasks, markDone] = useOptimistic(tasks, (state, id: string) =>
    state.map((t) => (t.id === id ? { ...t, status: "Xong" as const } : t)),
  );

  function complete(task: Task) {
    setError(null);
    startTransition(async () => {
      markDone(task.id);
      const res = await completeTask(task.id);
      if (!res.ok) setError(`Chưa đánh dấu xong “${task.title}”. ${res.error}`);
    });
  }

  return { tasks: optimisticTasks, complete, error, dismissError: () => setError(null) };
}
