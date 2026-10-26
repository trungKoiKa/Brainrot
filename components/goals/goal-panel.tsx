"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDownUpIcon, CheckIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { createGoalAction, trashGoalAction, updateGoalAction } from "@/app/actions/goals";
import { fieldClass, primaryButtonClass } from "@/components/form-bits";
import { ErrorNotice } from "@/components/tasks/task-row";
import { goalCounts, groupGoals, MAX_GOAL_TITLE, PRIORITY_SOFT_LIMIT, type Goal, type GoalType } from "@/lib/goals";
import type { Level } from "@/lib/period";
import { ProgressRing } from "./progress-ring";

const UNDO_MS = 5000;
const iconButton =
  "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground";

/**
 * Khối mục tiêu của một kỳ (SPEC-v0.4 4.2, 4.4): bộ đếm + vòng tròn %, nhóm Ưu tiên / Thường (nhãn dọc),
 * thêm nhanh, sửa tên tại chỗ, tích, đổi loại, xóa (vào Trash Notion, hoàn tác trong 5 giây).
 * Cập nhật lạc quan; lỗi thì trả về như trước và báo.
 */
export function GoalPanel({ level, periodKey, initial }: { level: Level; periodKey: string; initial: Goal[] }) {
  const [goals, setGoals] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ goal: Goal; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const counts = goalCounts(goals);
  const priorityCount = goals.filter((g) => g.type === "Ưu tiên").length;

  /** Áp thay đổi ngay; server lỗi → trả lại danh sách cũ. */
  async function optimistic(next: Goal[], save: () => Promise<{ ok: boolean; error?: string }>) {
    const before = goals;
    setGoals(next);
    setError(null);
    const res = await save();
    if (!res.ok) {
      setGoals(before);
      setError(res.error ?? "Không lưu được.");
    }
  }

  const patch = (id: string, change: Partial<Pick<Goal, "title" | "type" | "done">>) =>
    optimistic(
      goals.map((g) => (g.id === id ? { ...g, ...change } : g)),
      () => updateGoalAction(id, change),
    );

  function remove(goal: Goal) {
    const index = goals.findIndex((g) => g.id === goal.id);
    clearTimeout(undoTimer.current);
    setUndo({ goal, index });
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
    optimistic(
      goals.filter((g) => g.id !== goal.id),
      () => trashGoalAction(goal.id, true),
    );
  }

  function restore() {
    if (!undo) return;
    clearTimeout(undoTimer.current);
    const next = [...goals];
    next.splice(undo.index, 0, undo.goal);
    setUndo(null);
    optimistic(next, () => trashGoalAction(undo.goal.id, false));
  }

  return (
    <div>
      {error && <ErrorNotice message={error} onDismiss={() => setError(null)} />}
      <div className="flex items-center gap-5">
        <ProgressRing pct={counts.progress} empty={counts.total === 0} />
        <dl className="grid flex-1 grid-cols-3 gap-2 text-center">
          {[
            ["Xong", counts.completed],
            ["Đang làm", counts.inProgress],
            ["Tổng", counts.total],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface-muted px-2 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-serif text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 space-y-3">
        {groupGoals(goals).map(({ type, goals: list }) => (
          <section key={type} className="flex gap-3">
            {/* Nhãn nhóm viết dọc như template, màu Brainrot */}
            <h3
              className={`flex w-6 shrink-0 items-center justify-center rounded-md py-2 text-xs font-medium [writing-mode:vertical-rl] rotate-180 ${
                type === "Ưu tiên" ? "bg-danger-soft text-danger" : "bg-accent-soft text-primary"
              }`}
            >
              {type}
            </h3>
            <ul className="min-h-12 flex-1 divide-y divide-dashed divide-line">
              {list.length === 0 && <li className="py-2 text-sm text-muted-foreground">Chưa có mục tiêu {type.toLowerCase()}.</li>}
              {list.map((g) => (
                <GoalRow key={g.id} goal={g} onPatch={(c) => patch(g.id, c)} onRemove={() => remove(g)} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {priorityCount > PRIORITY_SOFT_LIMIT && (
        <p className="mt-3 text-xs text-muted-foreground">
          Đang có {priorityCount} mục tiêu ưu tiên — nên giữ tối đa {PRIORITY_SOFT_LIMIT} để tập trung.
        </p>
      )}

      {undo && (
        <div role="status" className="mt-3 flex items-center gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate">Đã xóa “{undo.goal.title}”</span>
          <button type="button" onClick={restore} className="font-medium text-primary hover:underline">
            Hoàn tác
          </button>
        </div>
      )}

      <AddGoal
        level={level}
        periodKey={periodKey}
        onAdded={(goal) => setGoals((list) => [...list, goal])}
        onError={setError}
      />
    </div>
  );
}

function GoalRow({
  goal,
  onPatch,
  onRemove,
}: {
  goal: Goal;
  onPatch: (change: Partial<Pick<Goal, "title" | "type" | "done">>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.title);
  const other: GoalType = goal.type === "Ưu tiên" ? "Thường" : "Ưu tiên";

  function save() {
    setEditing(false);
    const title = draft.trim();
    if (title && title !== goal.title) onPatch({ title });
    else setDraft(goal.title);
  }

  return (
    <li className="group flex items-center gap-2 py-1.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={goal.done}
        aria-label={`${goal.done ? "Bỏ xong" : "Đánh dấu xong"}: ${goal.title}`}
        onClick={() => onPatch({ done: !goal.done })}
        className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
          goal.done ? "border-primary bg-primary text-primary-foreground" : "border-line hover:border-primary"
        }`}
      >
        {goal.done && <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={3} />}
      </button>
      {editing ? (
        <input
          autoFocus
          aria-label="Sửa mục tiêu"
          value={draft}
          maxLength={MAX_GOAL_TITLE}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(goal.title);
              setEditing(false);
            }
          }}
          className={`${fieldClass} py-1`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Bấm để sửa"
          className={`min-w-0 flex-1 truncate text-left text-sm ${goal.done ? "text-muted-foreground line-through" : ""}`}
        >
          {goal.title}
        </button>
      )}
      {!editing && (
        <span className="flex shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <button type="button" className={iconButton} aria-label={`Sửa: ${goal.title}`} onClick={() => setEditing(true)}>
            <PencilIcon aria-hidden="true" className="size-3.5" />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label={`Chuyển sang ${other}: ${goal.title}`}
            title={`Chuyển sang ${other}`}
            onClick={() => onPatch({ type: other })}
          >
            <ArrowDownUpIcon aria-hidden="true" className="size-3.5" />
          </button>
          <button type="button" className={iconButton} aria-label={`Xóa: ${goal.title}`} onClick={onRemove}>
            <Trash2Icon aria-hidden="true" className="size-3.5" />
          </button>
        </span>
      )}
    </li>
  );
}

function AddGoal({
  level,
  periodKey,
  onAdded,
  onError,
}: {
  level: Level;
  periodKey: string;
  onAdded: (goal: Goal) => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalType>("Thường");
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const text = title.trim();
        if (!text) return;
        start(async () => {
          const res = await createGoalAction(level, periodKey, text, type);
          if (!res.ok) return onError(res.error);
          // "Kỳ" thật do server tính; ở client chỉ cần id để thao tác tiếp
          onAdded({ id: res.id, title: text, level, start: "", type, done: false });
          setTitle("");
        });
      }}
    >
      <input
        aria-label="Mục tiêu mới"
        placeholder="Thêm mục tiêu…"
        value={title}
        maxLength={MAX_GOAL_TITLE}
        onChange={(e) => setTitle(e.target.value)}
        className={`${fieldClass} min-w-48 flex-1`}
      />
      <select
        aria-label="Loại"
        value={type}
        onChange={(e) => setType(e.target.value as GoalType)}
        className={fieldClass.replace("w-full", "w-auto")}
      >
        <option value="Thường">Thường</option>
        <option value="Ưu tiên">Ưu tiên</option>
      </select>
      <button type="submit" disabled={pending || !title.trim()} className={primaryButtonClass}>
        {pending ? "Đang thêm…" : "Thêm"}
      </button>
    </form>
  );
}
