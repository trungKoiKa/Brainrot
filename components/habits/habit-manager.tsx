"use client";

import { useState, useTransition } from "react";
import { ArrowDownIcon, ArrowUpIcon, CircleStopIcon, Trash2Icon } from "lucide-react";
import { addHabitAction, deleteHabitAction, moveHabitAction, restoreHabitAction, stopHabitAction, type HabitResult } from "@/app/actions/habits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNotice } from "@/components/error-notice";
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
import { undoToast } from "@/components/undo-toast";

const iconButton =
  "flex size-10 md:size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";

/** Thêm / sắp xếp / ngừng / xoá thói quen của tháng đang xem (SPEC.md mục 5.3; xoá hẳn: SPEC.md mục 5.3, 11/11/2026). */
export function HabitManager({ month, habits }: { month: string; habits: Habit[] }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (action: () => Promise<HabitResult>, after?: () => void) =>
    start(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) return setError(res.error);
      after?.();
    });

  // Xoá hẳn → ẩn dòng ngay (không chờ server + tải lại trang), toast "Hoàn tác" 8 giây chèn lại thói quen,
  // ngày đã tích và liên kết mục tiêu. Lỗi thì hiện lại dòng và báo.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const hide = (id: string, on: boolean) =>
    setHidden((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const remove = (h: Habit) => {
    setError(null);
    hide(h.id, true);
    start(async () => {
      const res = await deleteHabitAction(h.id);
      if (!res.ok) {
        hide(h.id, false);
        return setError(res.error);
      }
      undoToast(`Đã xoá thói quen “${h.name}”`, () =>
        start(async () => {
          const back = await restoreHabitAction(res.snapshot);
          if (!back.ok) return setError(back.error);
          hide(h.id, false);
        }),
      );
    });
  };
  const shown = habits.filter((h) => !hidden.has(h.id));

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
        <Input
          aria-label="Tên thói quen mới"
          placeholder="Thêm thói quen…"
          value={name}
          maxLength={MAX_HABIT_NAME}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 max-md:h-10"
        />
        <Button type="submit" disabled={pending || !name.trim()} className="max-md:h-10">
          Thêm
        </Button>
      </form>
      <ul className="divide-y divide-line-soft">
        {shown.map((h, i) => {
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
                disabled={pending || i === shown.length - 1}
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
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <button
                      type="button"
                      className={`${iconButton} hover:text-danger`}
                      disabled={pending}
                      aria-label={`Xoá hẳn ${h.name}`}
                      title="Xoá hẳn (cả các ngày đã tích)"
                    />
                  }
                >
                  <Trash2Icon aria-hidden="true" className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá hẳn “{h.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Thói quen và mọi ngày đã tích của nó bị xoá ở mọi tháng; mục tiêu đang gắn thói quen này sẽ bỏ liên kết.
                      Có nút Hoàn tác trong 8 giây. Muốn giữ lịch sử thì dùng “Ngừng theo dõi”.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Giữ lại</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => remove(h)}>
                      Xoá hẳn
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Thói quen tự sang tháng sau cho tới khi ngừng. Ngừng theo dõi giữ lịch sử; xoá hẳn thì mất cả các ngày đã tích.
      </p>
    </div>
  );
}
