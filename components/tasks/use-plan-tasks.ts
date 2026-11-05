"use client";

import { useOptimistic, useState, useTransition } from "react";
import { completeTask, planTaskAction } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";

type Patch = { id: string; status?: "Xong"; plannedOn?: string | null };

/**
 * Tích xong + đặt Ngày làm, đổi UI ngay (optimistic). Lỗi → useOptimistic tự quay về dữ liệu server, chỉ cần báo lỗi.
 * Ghi xong, Server Action gọi updateTag → trang tải lại dữ liệu mới.
 */
export function usePlanTasks(initial: Task[]) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [tasks, apply] = useOptimistic(initial, (state, p: Patch) =>
    state.map((t) => (t.id === p.id ? { ...t, ...(p.status && { status: p.status }), ...(p.plannedOn !== undefined && { plannedOn: p.plannedOn }) } : t)),
  );

  const run = (patch: Patch, call: () => Promise<{ ok: true } | { ok: false; error: string }>, what: string) => {
    setError(null);
    startTransition(async () => {
      apply(patch);
      const res = await call();
      if (!res.ok) setError(`${what} ${res.error}`);
    });
  };

  return {
    tasks,
    error,
    dismissError: () => setError(null),
    complete: (t: Task) => run({ id: t.id, status: "Xong" }, () => completeTask(t.id), `Chưa đánh dấu xong “${t.title}”.`),
    plan: (t: Task, day: string | null) =>
      run({ id: t.id, plannedOn: day }, () => planTaskAction(t.id, day), `Chưa đổi Ngày làm của “${t.title}”.`),
  };
}

