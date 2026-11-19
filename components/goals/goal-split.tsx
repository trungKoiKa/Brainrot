"use client";

// Chia mục tiêu tháng xuống tuần (SPEC.md mục 12.2): mục tiêu tuần con dưới mục tiêu tháng, form "Chia cho tuần…",
// dòng "↑ mục tiêu tháng" và chọn lại mục tiêu tháng ở mục tiêu tuần.

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpIcon, CheckIcon } from "lucide-react";
import { createGoalAction, setGoalParentAction, updateGoalAction } from "@/app/actions/goals";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/native-select";
import { MAX_GOAL_TITLE, type Goal } from "@/lib/goals";

/** Một mục tiêu tuần con, đã tính trạng thái xong (kể cả tự xong). */
export type WeekChild = { id: string; title: string; done: boolean; manual: boolean; weekKey: string; weekLabel: string; href: string };
/** Mục tiêu tháng chọn làm cha được cho tuần đang xem. */
export type ParentOption = { id: string; title: string; href: string };

/**
 * Ngữ cảnh chia mục tiêu của khối Goal: ở Tháng là các tuần + con của từng mục tiêu; ở Tuần là các mục tiêu tháng
 * chọn được làm cha.
 */
export type Split =
  | { kind: "month"; weeks: { key: string; label: string }[]; defaultWeek: string; children: Record<string, WeekChild[]> }
  | { kind: "week"; parents: ParentOption[] };

const NO_PARENT = "Không thuộc mục tiêu tháng";

/** Dưới mục tiêu tháng: chip x/y, các mục tiêu tuần con, nút "+ Chia cho tuần…". */
export function WeekChildren({
  goal,
  split,
  onError,
}: {
  goal: Goal;
  split: Extract<Split, { kind: "month" }>;
  onError: (message: string) => void;
}) {
  const list = split.children[goal.id] ?? [];
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  const toggle = (c: WeekChild) =>
    start(async () => {
      const res = await updateGoalAction(c.id, { done: !c.manual });
      if (!res.ok) onError(res.error);
    });

  return (
    <div className="mt-1 pl-7 text-sm">
      {list.length > 0 && (
        <>
          <Badge variant={list.every((c) => c.done) ? "success-light" : "outline"} className="mb-1">
            {list.filter((c) => c.done).length}/{list.length} mục tiêu tuần xong
          </Badge>
          <ul className="space-y-0.5" aria-label={`Mục tiêu tuần của: ${goal.title}`}>
            {list.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="flex size-10 shrink-0 items-center justify-center md:size-6">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={c.done}
                    aria-label={`${c.manual ? "Bỏ xong" : "Đánh dấu xong"}: ${c.title}`}
                    disabled={pending}
                    onClick={() => toggle(c)}
                    className={`flex size-4 items-center justify-center rounded border transition-colors ${
                      c.done ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary"
                    }`}
                  >
                    {c.done && <CheckIcon aria-hidden="true" className="size-3" strokeWidth={3} />}
                  </button>
                </span>
                <Link href={c.href} className="shrink-0 text-xs text-muted-foreground tabular-nums hover:text-primary">
                  {c.weekLabel}
                </Link>
                <span className={`min-w-0 flex-1 break-words ${c.done ? "text-muted-foreground line-through" : ""}`}>{c.title}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {adding ? (
        <SplitForm goal={goal} split={split} onDone={() => setAdding(false)} onError={onError} />
      ) : (
        <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => setAdding(true)}>
          + Chia cho tuần…
        </button>
      )}
    </div>
  );
}

/** Tạo mục tiêu tuần con: chọn tuần + tên; cùng loại với mục tiêu tháng (SPEC.md mục 12.2). */
function SplitForm({
  goal,
  split,
  onDone,
  onError,
}: {
  goal: Goal;
  split: Extract<Split, { kind: "month" }>;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [week, setWeek] = useState(split.defaultWeek);
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-1.5 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const text = title.trim();
        if (!text) return;
        start(async () => {
          const res = await createGoalAction("week", week, text, goal.type, goal.id);
          if (!res.ok) return onError(res.error);
          setTitle("");
          onDone();
        });
      }}
    >
      <NativeSelect
        label="Tuần"
        value={week}
        options={split.weeks.map((w) => w.key)}
        labels={Object.fromEntries(split.weeks.map((w) => [w.key, w.label]))}
        onChange={setWeek}
        className="h-8"
      />
      <Input
        autoFocus
        aria-label={`Mục tiêu tuần cho: ${goal.title}`}
        placeholder="Tuần này cần làm gì cho mục tiêu này…"
        value={title}
        maxLength={MAX_GOAL_TITLE}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        className="h-8 min-w-48 flex-1"
      />
      <Button type="submit" size="sm" disabled={pending || !title.trim()}>
        {pending ? "Đang thêm…" : "Thêm"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDone}>
        Huỷ
      </Button>
    </form>
  );
}

/** Dưới mục tiêu tuần: "↑ mục tiêu tháng" (bấm mở tháng) và ô chọn lại khi đang đổi. */
export function ParentLine({
  goal,
  parents,
  editing,
  onDone,
  onError,
}: {
  goal: Goal;
  parents: ParentOption[];
  editing: boolean;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [pending, start] = useTransition();
  const parent = parents.find((p) => p.id === goal.parentId);
  if (editing) {
    return (
      <div className="mt-1 pl-7">
        <NativeSelect
          label="Thuộc mục tiêu tháng"
          value={goal.parentId ?? ""}
          options={["", ...parents.map((p) => p.id)]}
          labels={{ "": NO_PARENT, ...Object.fromEntries(parents.map((p) => [p.id, p.title])) }}
          onChange={(v) =>
            start(async () => {
              const res = await setGoalParentAction(goal.id, v || null);
              if (!res.ok) onError(res.error);
              onDone();
            })
          }
          className="h-8 max-w-full"
        />
        {pending && <span className="ml-2 text-xs text-muted-foreground">Đang lưu…</span>}
      </div>
    );
  }
  if (!parent) return null;
  return (
    <div className="mt-0.5 pl-7">
      <Link href={parent.href} className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowUpIcon aria-hidden="true" className="size-3 shrink-0" />
        <span className="truncate">{parent.title}</span>
      </Link>
    </div>
  );
}

/** Ô "Thuộc mục tiêu tháng" trong form thêm mục tiêu tuần. */
export function ParentSelect({ parents, value, onChange }: { parents: ParentOption[]; value: string; onChange: (v: string) => void }) {
  return (
    <NativeSelect
      label="Thuộc mục tiêu tháng"
      value={value}
      options={["", ...parents.map((p) => p.id)]}
      labels={{ "": NO_PARENT, ...Object.fromEntries(parents.map((p) => [p.id, p.title])) }}
      onChange={onChange}
      className="max-w-64 max-md:h-10"
    />
  );
}
