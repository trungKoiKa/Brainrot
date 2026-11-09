"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUpIcon,
  EllipsisIcon,
  ListPlusIcon,
  XIcon,
  CheckIcon,
  Link2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { completeTask, reopenTaskAction } from "@/app/actions/tasks";
import { MaybeLink } from "@/components/tasks/maybe-link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { carryOverGoalsAction, createGoalAction, linkTaskAction, trashGoalAction, updateGoalAction } from "@/app/actions/goals";
import { formatDay } from "@/lib/date";
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

export type LinkedTask = { id: string; title: string; url: string; plannedOn: string | null; done: boolean };

const UNDO_MS = 5000;
const iconButton =
  "flex size-10 md:size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground";

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
  linked,
  next: carry,
  openTasks,
}: {
  level: Level;
  periodKey: string;
  initial: Goal[];
  habits: { id: string; name: string }[];
  /** kỳ đã kết thúc → vòng % mới tô màu theo ngưỡng */
  ended: boolean;
  /** Việc đã gắn vào từng mục tiêu (SPEC-v1.0, Goal đợt 2) */
  linked: Record<string, LinkedTask[]>;
  /** Có mục tiêu chưa xong → nút chuyển sang kỳ sau; null = không hiện */
  next: { label: string } | null;
  /** Việc chưa xong, chưa gắn mục tiêu nào — chọn được ở "Gắn việc" (SPEC-v1.0, Goal đợt 3) */
  openTasks: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [goals, setGoals] = useState(initial);
  // Dữ liệu server mới (sau router.refresh) thay danh sách, không dựng lại cả khối → popover / focus / thông báo còn nguyên
  const [seen, setSeen] = useState(initial);
  // Đang có lưu dở (`saving`) thì giữ bản lạc quan; lưu xong sẽ refresh lại và bản server mới vào sau
  const [saving, setSaving] = useState(0);
  // Chỉ nhận dữ liệu server mới khi không còn lưu dở; lưu xong `saving` về 0 thì lần render kế tiếp áp bản mới nhất
  if (initial !== seen && saving === 0) {
    setSeen(initial);
    setGoals(initial);
  }
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
    setSaving((n) => n + 1);
    const res = await save();
    setSaving((n) => n - 1);
    if (!res.ok) {
      setGoals(before);
      setError(res.error ?? "Không lưu được.");
      return;
    }
    router.refresh(); // chip tuần, danh sách việc, % tự xong đều do server tính → làm mới sau mỗi lần lưu
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

  /** Gắn / bỏ gắn việc: danh sách việc do server tính → xong thì tải lại dữ liệu trang. */
  async function linkTask(taskId: string, goalId: string | null): Promise<boolean> {
    setError(null);
    const res = await linkTaskAction(taskId, goalId);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    router.refresh();
    return true;
  }

  /** Tích xong / bỏ tích việc ngay trên dòng mục tiêu: % tự xong do server tính → tải lại. */
  async function toggleTask(t: LinkedTask): Promise<void> {
    setError(null);
    const res = t.done ? await reopenTaskAction(t.id) : await completeTask(t.id);
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
            <ul className="divide-y divide-dashed divide-line">
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

      <div aria-live="polite">
        {undo && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">Đã xóa “{undo.goal.title}”</span>
            <button type="button" onClick={restore} className="font-medium text-primary hover:underline">
              Hoàn tác
            </button>
          </div>
        )}
      </div>

      {carry && counts.total > counts.completed && (
        <CarryOver level={level} periodKey={periodKey} count={counts.total - counts.completed} label={carry.label} onError={setError} />
      )}

      <AddGoal
        level={level}
        periodKey={periodKey}
        onAdded={(goal) => {
          setGoals((list) => [...list, goal]);
          router.refresh();
        }}
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
  tasks,
  openTasks,
  habits,
  onPatch,
  onLink,
  onLinkTask,
  onToggleTask,
  onRemove,
}: {
  goal: Goal;
  tasks: LinkedTask[];
  openTasks: { id: string; title: string }[];
  habits: { id: string; name: string }[];
  onPatch: (change: Partial<Pick<Goal, "title" | "type" | "done">>) => void;
  onLink: (habitId: string | null, threshold: number | null) => Promise<void>;
  onLinkTask: (taskId: string, goalId: string | null) => Promise<boolean>;
  onToggleTask: (task: LinkedTask) => void;
  onRemove: () => void;
}) {
  const [picking, setPicking] = useState(false);
  // Việc vừa bỏ gắn → dải "Hoàn tác" 5 giây (SPEC-v1.0, Goal đợt 6)
  const [unlinked, setUnlinked] = useState<LinkedTask | null>(null);
  const unlinkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(unlinkTimer.current), []);
  async function unlink(t: LinkedTask) {
    clearTimeout(unlinkTimer.current);
    if (!(await onLinkTask(t.id, null))) return; // lỗi thì không hiện Hoàn tác
    setUnlinked(t);
    unlinkTimer.current = setTimeout(() => setUnlinked(null), UNDO_MS);
  }
  async function relink() {
    if (!unlinked) return;
    clearTimeout(unlinkTimer.current);
    const t = unlinked;
    setUnlinked(null);
    await onLinkTask(t.id, goal.id);
  }
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
    <li id={`goal-${goal.id}`} className="scroll-mt-20 py-1.5">
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
          <div className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
            <span className={`truncate ${isGoalDone(goal) ? "text-muted-foreground line-through" : ""}`}>{goal.title}</span>
            {goal.autoDone && !goal.done && <Badge variant="success-light" className="shrink-0">tự xong</Badge>}
          </div>
        )}
        {!editing && (
          <span className="flex shrink-0 items-center gap-0.5">
            <button type="button" className={iconButton} aria-label={`Sửa: ${goal.title}`} onClick={() => setEditing(true)}>
              <PencilIcon aria-hidden="true" className="size-3.5" />
            </button>
            <button type="button" className={iconButton} aria-label={`Xóa: ${goal.title}`} onClick={onRemove}>
              <Trash2Icon aria-hidden="true" className="size-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<button type="button" className={iconButton} aria-label={`Thêm tùy chọn: ${goal.title}`} />}>
                <EllipsisIcon aria-hidden="true" className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setPicking(true)}>
                  <ListPlusIcon aria-hidden="true" /> Gắn việc
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLinking(true)}>
                  <Link2Icon aria-hidden="true" /> Gắn thói quen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPatch({ type: other })}>
                  <ArrowDownUpIcon aria-hidden="true" /> Chuyển sang {other}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        )}
      </div>
      {goal.auto && goal.auto.length > 0 && (
        <div className="mt-0.5 pl-7">
          <AutoChips auto={goal.auto} />
        </div>
      )}
      <div className="mt-1 pl-7 text-sm">
        {tasks.length > 0 && (
          <ul className="space-y-0.5" aria-label={`Việc của mục tiêu: ${goal.title}`}>
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-2">
                <label className="flex size-10 md:size-6 shrink-0 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => onToggleTask(t)}
                  aria-label={t.done ? `Bỏ đánh dấu xong: ${t.title}` : `Đánh dấu xong: ${t.title}`}
                  className="size-4 shrink-0 cursor-pointer accent-[var(--primary)]"
                />
                </label>
                <MaybeLink href={t.url} className={`min-w-0 flex-1 basis-40 break-words hover:text-primary ${t.done ? "text-muted-foreground line-through" : ""}`}>
                  {t.title || "(Chưa đặt tên)"}
                </MaybeLink>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {t.done ? "xong" : t.plannedOn ? formatDay(t.plannedOn, true) : "chưa xếp ngày"}
                </span>
                <button
                  type="button"
                  aria-label={`Bỏ gắn “${t.title}” khỏi mục tiêu`}
                  title="Bỏ gắn"
                  onClick={() => unlink(t)}
                  className="flex size-10 md:size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-surface-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <XIcon aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div aria-live="polite">
          {unlinked && (
            <p className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">Đã bỏ gắn “{unlinked.title || "(Chưa đặt tên)"}”</span>
            <button type="button" onClick={relink} className="shrink-0 rounded-md font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
              Hoàn tác
            </button>
            </p>
          )}
        </div>
        <TaskPicker
          open={picking}
          onOpenChange={setPicking}
          goalTitle={goal.title}
          openTasks={openTasks}
          onPick={(id) => onLinkTask(id, goal.id)}
          trigger={
            <span className="text-xs">+ Gắn việc</span>
          }
        />
      </div>
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

/** "Chuyển N mục tiêu chưa xong sang <kỳ sau>" (SPEC-v1.0, Goal đợt 2): tạo bản sao ở kỳ sau, không đụng mục tiêu hiện tại. */
function CarryOver({
  level,
  periodKey,
  count,
  label,
  onError,
}: {
  level: Level;
  periodKey: string;
  count: number;
  label: string;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Kết quả + id các bản sao vừa tạo: "Hoàn tác" = xoá mềm chính các bản sao đó (SPEC-v1.0, Goal đợt 6)
  const [result, setResult] = useState<{ text: string; ids: string[] } | null>(null);
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await carryOverGoalsAction(level, periodKey);
            if (!res.ok) return onError(res.error);
            setResult({
              text: res.ids.length ? `Đã chuyển ${res.ids.length} mục tiêu sang ${label}.` : `${label} đã có đủ các mục tiêu này.`,
              ids: res.ids,
            });
            router.refresh();
          })
        }
        className="rounded-md border border-line px-3 py-1.5 font-medium outline-none hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {pending ? "Đang chuyển…" : `Chuyển ${count} mục tiêu chưa xong sang ${label}`}
      </button>
      {result && (
        <span role="status" className="flex items-center gap-2 text-muted-foreground">
          {result.text}
          {result.ids.length > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const results = await Promise.all(result.ids.map((id) => trashGoalAction(id, true)));
                  const failed = results.find((r) => !r.ok);
                  if (failed && !failed.ok) return onError(failed.error);
                  setResult({ text: `Đã hoàn tác, ${label} không còn các mục tiêu vừa chuyển.`, ids: [] });
                  router.refresh();
                })
              }
              className="rounded-md font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Hoàn tác
            </button>
          )}
        </span>
      )}
    </p>
  );
}

/**
 * Chọn việc gắn vào mục tiêu (SPEC-v1.0, Goal đợt 4): popover có ô tìm kiếm tự focus, giữ mở để gắn liên tiếp
 * nhiều việc, dòng đang gắn hiện "Đang gắn…". Đóng bằng Esc / bấm ngoài, focus về nút mở.
 */
function TaskPicker({
  open,
  onOpenChange,
  goalTitle,
  openTasks,
  onPick,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalTitle: string;
  openTasks: { id: string; title: string }[];
  onPick: (taskId: string) => Promise<boolean>;
  trigger: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();
  const shown = openTasks.filter((t) => t.title.toLowerCase().includes(q));
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="mt-0.5 rounded-md text-left text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-2 p-2">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          ref={inputRef}
          aria-label={`Tìm việc để gắn vào: ${goalTitle}`}
          placeholder="Tìm việc chưa gắn mục tiêu…"
          className={`${fieldClass} py-1.5`}
        />
        {openTasks.length === 0 ? (
          <p className="px-1 py-1 text-sm text-muted-foreground">Không còn việc nào chưa gắn mục tiêu. Thêm việc mới ở Tasks.</p>
        ) : shown.length === 0 ? (
          <p className="px-1 py-1 text-sm text-muted-foreground">Không có việc nào khớp “{query.trim()}”.</p>
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto" aria-label="Việc chưa gắn mục tiêu">
            {shown.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy(t.id);
                    const ok = await onPick(t.id);
                    if (ok) setLast(t.title || "(Chưa đặt tên)"); // lỗi thì không báo "Đã gắn"
                    inputRef.current?.focus(); // dòng vừa bấm đã biến mất → trả focus về ô tìm kiếm
                    setBusy(null);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm break-words outline-none hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                >
                  <span className="min-w-0">{t.title || "(Chưa đặt tên)"}</span>
                  {busy === t.id && <span className="shrink-0 text-xs text-muted-foreground">Đang gắn…</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {last ? `Đã gắn: ${last}` : ""}
        </p>
      </PopoverContent>
    </Popover>
  );
}
