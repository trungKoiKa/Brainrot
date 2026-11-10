"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, CircleStopIcon } from "lucide-react";
import { addHabitAction, moveHabitAction, stopHabitAction, type HabitResult } from "@/app/actions/habits";
import { fieldClass, primaryButtonClass } from "@/components/form-bits";
import { ErrorNotice } from "@/components/tasks/task-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MAX_HABIT_NAME } from "@/lib/habits";
import type { Habit } from "@/lib/types";
import { monthLabel, monthOf, shiftMonth } from "@/lib/period";

const iconButton =
  "flex size-10 md:size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";

/** Thêm / sắp xếp / ngừng thói quen của tháng đang xem (SPEC-v0.4 3.3). */
export function HabitManager({ month, habits }: { month: string; habits: Habit[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (action: () => Promise<HabitResult>, after?: () => void) =>
    start(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) return setError(res.error);
      after?.();
      router.refresh();
    });

  return (
    <div>
      {error && <ErrorNotice message={error} onDismiss={() => setError(null)} />}
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addHabitAction(month, name), () => setName(""));
        }}
      >
        <input
          aria-label="Tên thói quen mới"
          placeholder="Thêm thói quen…"
          value={name}
          maxLength={MAX_HABIT_NAME}
          onChange={(e) => setName(e.target.value)}
          className={`${fieldClass} min-w-0 flex-1`}
        />
        <button type="submit" disabled={pending || !name.trim()} className={primaryButtonClass}>
          Thêm
        </button>
      </form>
      <ul className="divide-y divide-line">
        {habits.map((h, i) => {
          const ending = h.to !== null && monthOf(h.to) === month;
          return (
            <li key={h.id} className="flex items-center gap-1 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {h.name}
                {ending && <span className="ml-2 text-xs text-muted-foreground">· ngừng từ {monthLabel(shiftMonth(month, 1))}</span>}
              </span>
              <button
                type="button"
                className={iconButton}
                disabled={pending || i === 0}
                aria-label={`Đưa ${h.name} lên`}
                onClick={() => run(() => moveHabitAction(month, h.id, -1))}
              >
                <ArrowUpIcon aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={pending || i === habits.length - 1}
                aria-label={`Đưa ${h.name} xuống`}
                onClick={() => run(() => moveHabitAction(month, h.id, 1))}
              >
                <ArrowDownIcon aria-hidden="true" className="size-4" />
              </button>
              {/* Hộp xác nhận của thư viện thay confirm() của trình duyệt (rà soát 11/2026) */}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <button
                      type="button"
                      className={iconButton}
                      disabled={pending || ending}
                      aria-label={`Ngừng theo dõi ${h.name} từ tháng sau`}
                      title="Ngừng theo dõi từ tháng sau (lịch sử giữ nguyên)"
                    />
                  }
                >
                  <CircleStopIcon aria-hidden="true" className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ngừng theo dõi “{h.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Thói quen không còn ở {monthLabel(shiftMonth(month, 1))} trở đi. Lịch sử các tháng trước vẫn giữ nguyên.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Giữ lại</AlertDialogCancel>
                    <AlertDialogAction onClick={() => run(() => stopHabitAction(month, h.id))}>Ngừng theo dõi</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Thói quen tự sang tháng sau cho tới khi ngừng.
      </p>
    </div>
  );
}
