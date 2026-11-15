"use client";

// Một dòng mục tiêu trên Goal (SPEC.md mục 5.3): tích xong, sửa tên, đổi loại, gắn thói quen, gắn / bỏ gắn việc.

import { useRef, useState } from "react";
import { ArrowDownUpIcon, EllipsisIcon, ListPlusIcon, XIcon, CheckIcon, Link2Icon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDay } from "@/lib/date";
import { fold } from "@/lib/text";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/reui/badge";
import { DEFAULT_THRESHOLD, isGoalDone, MAX_GOAL_TITLE, type AutoInfo, type Goal, type GoalType } from "@/lib/goals";
import { undoToast } from "@/components/undo-toast";
import { NativeSelect } from "@/components/native-select";
import type { LinkedTask } from "./goal-panel";

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

export function GoalRow({
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
  // Bỏ gắn việc → toast "Hoàn tác" 8 giây (SPEC.md mục 5.3; sonner thay dải tự viết)
  async function unlink(t: LinkedTask) {
    if (!(await onLinkTask(t.id, null))) return; // lỗi thì không hiện Hoàn tác
    undoToast(`Đã bỏ gắn “${t.title || "(Chưa đặt tên)"}”`, () => void onLinkTask(t.id, goal.id));
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
                : "border-input hover:border-primary"
          }`}
        >
          {isGoalDone(goal) && <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={3} />}
        </button>
        {editing ? (
          <Input
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
            className="h-8 flex-1"
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
            <span className={`truncate ${isGoalDone(goal) ? "text-muted-foreground line-through" : ""}`}>{goal.title}</span>
            {goal.autoDone && !goal.done && <Badge variant="success-light" className="shrink-0">tự xong</Badge>}
          </div>
        )}
        {!editing && (
          <span className="flex shrink-0 items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="max-md:size-10" aria-label={`Tùy chọn: ${goal.title}`} />}>
                <EllipsisIcon aria-hidden="true" className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <PencilIcon aria-hidden="true" /> Sửa tên
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPicking(true)}>
                  <ListPlusIcon aria-hidden="true" /> Gắn việc
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLinking(true)}>
                  <Link2Icon aria-hidden="true" /> Gắn thói quen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPatch({ type: other })}>
                  <ArrowDownUpIcon aria-hidden="true" /> Chuyển sang {other}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onRemove}>
                  <Trash2Icon aria-hidden="true" /> Xóa
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
              <li key={t.id} className="flex items-center gap-x-2">
                <span className="flex size-10 shrink-0 items-center justify-center md:size-6">
                  <Checkbox
                    checked={t.done}
                    onCheckedChange={() => onToggleTask(t)}
                    aria-label={t.done ? `Bỏ đánh dấu xong: ${t.title}` : `Đánh dấu xong: ${t.title}`}
                  />
                </span>
                {/* Tên việc mở trang Tasks (SPEC.md mục 5.3) */}
                <Link href="/tasks" className={`min-w-0 flex-1 break-words outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring ${t.done ? "text-muted-foreground line-through" : ""}`}>
                  {t.title || "(Chưa đặt tên)"}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {t.done ? "xong" : t.plannedOn ? formatDay(t.plannedOn, true) : "chưa xếp ngày"}
                </span>
                <button
                  type="button"
                  aria-label={`Bỏ gắn “${t.title}” khỏi mục tiêu`}
                  title="Bỏ gắn"
                  onClick={() => unlink(t)}
                  className="flex size-10 md:size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-surface-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <XIcon aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
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

/** Gắn một thói quen + ngưỡng %: mục tiêu tự xong khi % thói quen trong kỳ ≥ ngưỡng (SPEC.md mục 5.3). */
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
      <NativeSelect
        label="Thói quen"
        value={habitId}
        options={habits.map((h) => h.id)}
        labels={Object.fromEntries(habits.map((h) => [h.id, h.name]))}
        onChange={setHabitId}
      />
      <span className="text-muted-foreground">đạt ≥</span>
      <Input
        aria-label="Ngưỡng %"
        type="number"
        min={1}
        max={100}
        value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
        className="w-20"
      />
      <span className="text-muted-foreground">%</span>
      <Button type="button" disabled={!valid || saving} onClick={() => save(habitId, value)}>
        {saving ? "Đang lưu…" : "Lưu"}
      </Button>
      {goal.habitId && (
        <Button type="button" variant="ghost" onClick={() => save(null, null)} disabled={saving}>
          Bỏ gắn
        </Button>
      )}
      <Button type="button" variant="ghost" onClick={onCancel}>
        Hủy
      </Button>
    </div>
  );
}

/**
 * Chọn việc gắn vào mục tiêu (SPEC.md mục 5.3): popover có ô tìm kiếm tự focus, giữ mở để gắn liên tiếp
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
  const q = fold(query); // bỏ dấu: "don" khớp "Dọn" (rà soát 11/2026 P2)
  const shown = openTasks.filter((t) => fold(t.title).includes(q));
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
            aria-label={`Gắn việc vào mục tiêu: ${goalTitle}`}
            className="mt-0.5 inline-flex min-h-10 items-center rounded-md text-left text-muted-foreground underline-offset-4 md:min-h-0 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring"
          />
        }
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-2 p-2" aria-label={`Gắn việc vào mục tiêu: ${goalTitle}`}>
        <Input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          ref={inputRef}
          aria-label={`Tìm việc để gắn vào: ${goalTitle}`}
          placeholder="Tìm việc chưa gắn mục tiêu…"
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
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm break-words outline-none hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60"
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
