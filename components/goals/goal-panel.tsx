"use client";

import { useState } from "react";
import { completeTask, reopenTaskAction } from "@/app/actions/tasks";
import { linkTaskAction, trashGoalAction, updateGoalAction } from "@/app/actions/goals";
import { Badge } from "@/components/reui/badge";
import { ErrorNotice } from "@/components/error-notice";
import { goalCounts, groupGoals, isGoalDone, PRIORITY_SOFT_LIMIT, type Goal } from "@/lib/goals";
import type { Level } from "@/lib/period";
import { ProgressRing } from "./progress-ring";
import { undoToast } from "@/components/undo-toast";
import { GoalRow } from "./goal-row";
import { AddGoal, CarryOver } from "./goal-forms";
import type { Split } from "./goal-split";

export type LinkedTask = { id: string; title: string; plannedOn: string | null; done: boolean };

/**
 * Khối mục tiêu của một kỳ (SPEC.md mục 5.3): bộ đếm + vòng tròn %, nhóm Ưu tiên / Thường (Badge),
 * thêm nhanh, sửa tên tại chỗ, tích, đổi loại, xóa mềm (hoàn tác trong 8 giây),
 * gắn thói quen + ngưỡng % để tự xong (SPEC.md mục 5.3). Cập nhật lạc quan; lỗi thì trả về như trước và báo.
 * `habits`: thói quen có thể gắn (đang theo dõi trong kỳ).
 */
export function GoalPanel({
  level,
  periodKey,
  initial,
  habits,
  ended,
  linked,
  next: carry,
  openTasks,
  split,
}: {
  level: Level;
  periodKey: string;
  initial: Goal[];
  habits: { id: string; name: string }[];
  /** kỳ đã kết thúc → vòng % mới tô màu theo ngưỡng */
  ended: boolean;
  /** Việc đã gắn vào từng mục tiêu (SPEC.md mục 5.3) */
  linked: Record<string, LinkedTask[]>;
  /** Có mục tiêu chưa xong → nút chuyển sang kỳ sau; null = không hiện */
  next: { label: string } | null;
  /** Việc chưa xong, chưa gắn mục tiêu nào — chọn được ở "Gắn việc" (SPEC.md mục 5.3) */
  openTasks: { id: string; title: string }[];
  /** Chia mục tiêu tháng xuống tuần (SPEC.md mục 12.2) */
  split?: Split;
}) {
  const [goals, setGoals] = useState(initial);
  // Dữ liệu server mới (sau mỗi Server Action) thay danh sách, không dựng lại cả khối → popover / focus / thông báo còn nguyên
  const [seen, setSeen] = useState(initial);
  // Đang có lưu dở (`saving`) thì giữ bản lạc quan; lưu xong sẽ refresh lại và bản server mới vào sau
  const [saving, setSaving] = useState(0);
  // Chỉ nhận dữ liệu server mới khi không còn lưu dở; lưu xong `saving` về 0 thì lần render kế tiếp áp bản mới nhất
  if (initial !== seen && saving === 0) {
    setSeen(initial);
    setGoals(initial);
  }
  const [error, setError] = useState<string | null>(null);

  const counts = goalCounts(goals);
  const priorityCount = goals.filter((g) => g.type === "Ưu tiên").length;

  /** Áp thay đổi ngay; server lỗi → trả lại danh sách cũ. */
  async function optimistic(next: Goal[], save: () => Promise<{ ok: boolean; error?: string }>) {
    const before = goals;
    setGoals(next);
    setError(null);
    setSaving((n) => n + 1);
    const res = await save();
    setSaving((n) => n - 1);
    if (!res.ok) {
      setGoals(before);
      setError(res.error ?? "Không lưu được.");
      return;
    }
    // Server Action đã gọi refreshData() → trang nhận dữ liệu mới trong cùng phản hồi; không router.refresh() thêm (rà soát A4)
  }

  const patch = (id: string, change: Partial<Pick<Goal, "title" | "type" | "done">>) =>
    optimistic(
      goals.map((g) => (g.id === id ? { ...g, ...change } : g)),
      () => updateGoalAction(id, change),
    );

  /** Gắn / bỏ gắn thói quen: % thói quen do server tính → lưu xong thì tải lại dữ liệu trang. */
  async function link(id: string, habitId: string | null, threshold: number | null): Promise<void> {
    setError(null);
    const res = await updateGoalAction(id, { habitId, threshold });
    if (!res.ok) return setError(res.error);
  }

  /** Gắn / bỏ gắn việc: danh sách việc do server tính → xong thì tải lại dữ liệu trang. */
  async function linkTask(taskId: string, goalId: string | null): Promise<boolean> {
    setError(null);
    const res = await linkTaskAction(taskId, goalId);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    return true;
  }

  /** Tích xong / bỏ tích việc ngay trên dòng mục tiêu: % tự xong do server tính → tải lại. */
  async function toggleTask(t: LinkedTask): Promise<void> {
    setError(null);
    const res = t.done ? await reopenTaskAction(t.id) : await completeTask(t.id);
    if (!res.ok) return setError(res.error);
  }

  // Xoá mềm + toast Hoàn tác (sonner, xếp chồng; thay dải hoàn tác tự viết — rà soát 11/2026)
  function remove(goal: Goal) {
    optimistic(
      goals.filter((g) => g.id !== goal.id),
      () => trashGoalAction(goal.id, true),
    );
    undoToast(`Đã xóa “${goal.title}”`, () => {
      setError(null);
      trashGoalAction(goal.id, false).then((res) => !res.ok && setError(res.error));
    });
  }

  return (
    <div>
      {error && <ErrorNotice message={error} onDismiss={() => setError(null)} />}
      <div className="flex items-center gap-4">
        <ProgressRing pct={counts.progress} size={56} empty={counts.total === 0} neutral={!ended} />
        <p className="text-sm text-muted-foreground">
          {counts.total === 0 ? (
            "Chưa có mục tiêu nào."
          ) : (
            <>
              <span className="font-mono text-lg text-foreground tabular-nums">
                {counts.completed}/{counts.total}
              </span>{" "}
              xong
              {counts.inProgress > 0 && <> · {counts.inProgress} đang làm</>}
            </>
          )}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {groupGoals(goals)
          .filter((grp) => grp.goals.length > 0)
          .map(({ type, goals: list }) => (
          <section key={type} className="flex flex-col gap-1.5">
            <h3 className="flex items-center gap-2">
              <Badge variant={type === "Ưu tiên" ? "primary-light" : "outline"}>{type}</Badge>
              <span aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
                {list.filter((g) => g.title.trim()).length}
              </span>
            </h3>
            <ul className="divide-y divide-line-soft">
              {list.map((g) => (
                <GoalRow
                  key={g.id}
                  goal={g}
                  tasks={linked[g.id] ?? []}
                  openTasks={openTasks}
                  onLinkTask={linkTask}
                  onToggleTask={toggleTask}
                  habits={habits}
                  onPatch={(c) => patch(g.id, c)}
                  onLink={(h, t) => link(g.id, h, t)}
                  onRemove={() => remove(g)}
                  split={split}
                  onError={setError}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {counts.total > 0 && goals.every((g) => (linked[g.id] ?? []).length === 0) && (
        <p className="mt-3 text-xs text-muted-foreground">Gắn việc vào mục tiêu để xếp ngày trong tuần và theo dõi tiến độ.</p>
      )}

      {priorityCount > PRIORITY_SOFT_LIMIT && (
        <p className="mt-3 text-xs text-muted-foreground">
          Đang có {priorityCount} mục tiêu ưu tiên — nên giữ tối đa {PRIORITY_SOFT_LIMIT} để tập trung.
        </p>
      )}

      {carry && counts.total > counts.completed && (
        <CarryOver
          level={level}
          periodKey={periodKey}
          goalIds={goals.filter((g) => g.title.trim() && !isGoalDone(g)).map((g) => g.id)}
          label={carry.label}
          onError={setError}
        />
      )}

      <AddGoal
        level={level}
        periodKey={periodKey}
        parents={split?.kind === "week" ? split.parents : []}
        onAdded={(goal) => {
          setGoals((list) => [...list, goal]);
        }}
        onError={setError}
      />
    </div>
  );
}
