"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUpIcon,
  CheckIcon,
  Link2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { createGoalAction, trashGoalAction, updateGoalAction } from "@/app/actions/goals";
import { fieldClass, primaryButtonClass } from "@/components/form-bits";
import { Badge } from "@/components/reui/badge";
import { ErrorNotice } from "@/components/tasks/task-row";
import {
  DEFAULT_THRESHOLD,
  goalCounts,
  groupGoals,
  isGoalDone,
  MAX_GOAL_TITLE,
  PRIORITY_SOFT_LIMIT,
  type AutoInfo,
  type Goal,
  type GoalType,
} from "@/lib/goals";
import type { Level } from "@/lib/period";
import { ProgressRing } from "./progress-ring";

const UNDO_MS = 5000;
const iconButton =
  "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground";

/**
 * Khối mục tiêu của một kỳ (SPEC-v0.4 4.2, 4.4): bộ đếm + vòng tròn %, nhóm Ưu tiên / Thường (Badge),
 * thêm nhanh, sửa tên tại chỗ, tích, đổi loại, xóa mềm (hoàn tác trong 5 giây),
 * gắn thói quen + ngưỡng % để tự xong (SPEC-v0.4 4.3). Cập nhật lạc quan; lỗi thì trả về như trước và báo.
 * `habits`: thói quen có thể gắn (đang theo dõi trong kỳ).
 */
export function GoalPanel({
  level,
  periodKey,
  initial,
  habits,
  ended,
}: {
  level: Level;
  periodKey: string;
  initial: Goal[];
  habits: { id: string; name: string }[];
  /** kỳ đã kết thúc → vòng % mới tô màu theo ngưỡng */
  ended: boolean;
}) {
  const router = useRouter();
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

  /** Gắn / bỏ gắn thói quen: % thói quen do server tính → lưu xong thì tải lại dữ liệu trang. */
  async function link(id: string, habitId: string | null, threshold: number | null): Promise<void> {
    setError(null);
    const res = await updateGoalAction(id, { habitId, threshold });
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

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
      <div className="flex items-center gap-4">
        <ProgressRing pct={counts.progress} size={56} empty={counts.total === 0} neutral={!ended} />
        <p className="text-sm text-muted-foreground">
          {counts.total === 0 ? (
            "Chưa có mục tiêu nào."
          ) : (
            <>
              <span className="font-serif text-lg font-semibold text-foreground tabular-nums">
                {counts.completed}/{counts.total}
              </span>{" "}
              xong
              {counts.inProgress > 0 && <> · {counts.inProgress} đang làm</>}
            </>
          )}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {groupGoals(goals).map(({ type, goals: list }) => (
          <section key={type} className="flex flex-col gap-1.5">
            <h3 className="flex items-center gap-2">
              <Badge variant={type === "Ưu tiên" ? "primary-light" : "outline"}>{type}</Badge>
              <span aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
                {list.filter((g) => g.title.trim()).length}
              </span>
            </h3>
            <ul className="min-h-12 divide-y divide-dashed divide-line">
              {list.length === 0 && <li className="py-2 text-sm text-muted-foreground">Chưa có mục tiêu {type.toLowerCase()}.</li>}
              {list.map((g) => (
                <GoalRow
                  key={g.id}
                  goal={g}
                  habits={habits}
                  onPatch={(c) => patch(g.id, c)}
                  onLink={(h, t) => link(g.id, h, t)}
                  onRemove={() => remove(g)}
                />
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

/** Lý do tự xong / tiến độ liên kết, hiện nhỏ dưới tên mục tiêu. */
function AutoChips({ auto }: { auto: AutoInfo[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {auto.map((a) =>
        a.kind === "habit" ? (
          <Badge key="habit" variant={a.pct !== null && a.pct >= a.threshold ? "success-light" : "outline"}>
            {a.habit} {a.pct === null ? "chưa bắt đầu" : `${a.pct}%`} / {a.threshold}%
          </Badge>
        ) : (
          <Badge key="tasks" variant={a.done === a.total ? "success-light" : "outline"}>
            {a.done}/{a.total} task
          </Badge>
        ),
      )}
    </span>
  );
}

function GoalRow({
  goal,
  habits,
  onPatch,
  onLink,
  onRemove,
}: {
  goal: Goal;
  habits: { id: string; name: string }[];
  onPatch: (change: Partial<Pick<Goal, "title" | "type" | "done">>) => void;
  onLink: (habitId: string | null, threshold: number | null) => Promise<void>;
  onRemove: () => void;
}) {
  const [linking, setLinking] = useState(false);
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
    <li className="py-1.5">
      <div className="group flex items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={isGoalDone(goal)}
          aria-label={`${goal.done ? "Bỏ xong" : "Đánh dấu xong"}: ${goal.title}`}
          title={goal.autoDone && !goal.done ? "Tự xong theo liên kết — bấm để tích tay" : undefined}
          onClick={() => onPatch({ done: !goal.done })}
          className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
            goal.done
              ? "border-primary bg-primary text-primary-foreground"
              : goal.autoDone
                ? "border-primary bg-accent-soft text-primary"
                : "border-line hover:border-primary"
          }`}
        >
          {isGoalDone(goal) && <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={3} />}
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
            className="flex min-w-0 flex-1 items-baseline gap-2 text-left text-sm"
          >
            <span className={`truncate ${isGoalDone(goal) ? "text-muted-foreground line-through" : ""}`}>{goal.title}</span>
            {goal.autoDone && !goal.done && <Badge variant="success-light" className="shrink-0">tự xong</Badge>}
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
              aria-label={`Gắn thói quen: ${goal.title}`}
              title="Gắn thói quen để tự xong"
              onClick={() => setLinking((v) => !v)}
            >
              <Link2Icon aria-hidden="true" className="size-3.5" />
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
      </div>
      {goal.auto && goal.auto.length > 0 && (
        <div className="mt-0.5 pl-7">
          <AutoChips auto={goal.auto} />
        </div>
      )}
      {linking && (
        <LinkHabit
          goal={goal}
          habits={habits}
          onCancel={() => setLinking(false)}
          onSave={async (h, t) => {
            await onLink(h, t);
            setLinking(false);
          }}
        />
      )}
    </li>
  );
}

/** Gắn một thói quen + ngưỡng %: mục tiêu tự xong khi % thói quen trong kỳ ≥ ngưỡng (SPEC-v0.4 4.3). */
function LinkHabit({
  goal,
  habits,
  onSave,
  onCancel,
}: {
  goal: Goal;
  habits: { id: string; name: string }[];
  onSave: (habitId: string | null, threshold: number | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [habitId, setHabitId] = useState(goal.habitId ?? habits[0]?.id ?? "");
  const [threshold, setThreshold] = useState(String(goal.threshold ?? DEFAULT_THRESHOLD));
  const [saving, setSaving] = useState(false);
  const save = async (h: string | null, t: number | null) => {
    setSaving(true);
    await onSave(h, t);
    setSaving(false);
  };
  const value = Number(threshold);
  const valid = Boolean(habitId) && Number.isInteger(value) && value >= 1 && value <= 100;

  if (habits.length === 0) {
    return <p className="mt-2 pl-7 text-xs text-muted-foreground">Chưa có thói quen nào trong kỳ này để gắn.</p>;
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 pl-7 text-sm">
      <span className="text-muted-foreground">Tự xong khi</span>
      <select
        aria-label="Thói quen"
        value={habitId}
        onChange={(e) => setHabitId(e.target.value)}
        className={`${fieldClass.replace("w-full", "w-auto")} py-1`}
      >
        {habits.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground">đạt ≥</span>
      <input
        aria-label="Ngưỡng %"
        type="number"
        min={1}
        max={100}
        value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
        className={`${fieldClass} w-20 py-1`}
      />
      <span className="text-muted-foreground">%</span>
      <button type="button" disabled={!valid || saving} onClick={() => save(habitId, value)} className={`${primaryButtonClass} py-1`}>
        {saving ? "Đang lưu…" : "Lưu"}
      </button>
      {goal.habitId && (
        <button type="button" onClick={() => save(null, null)} disabled={saving} className="text-muted-foreground hover:text-foreground">
          Bỏ gắn
        </button>
      )}
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
        Hủy
      </button>
    </div>
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
          onAdded({ id: res.id, title: text, level, start: "", type, done: false, habitId: null, threshold: null, taskIds: [] });
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
