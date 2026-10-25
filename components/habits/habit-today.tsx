"use client";

import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { ErrorNotice } from "@/components/tasks/task-row";
import { useHabitDays } from "./use-habit-days";

/** Thẻ "Thói quen hôm nay" trên Today (SPEC-v0.4 3.3): bấm là lưu. */
export function HabitToday({ habits, done, today }: { habits: string[]; done: string[]; today: string }) {
  const { days, toggle, error, dismissError } = useHabitDays({ [today]: done });
  const list = days[today] ?? [];

  if (habits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có thói quen nào cho tháng này.{" "}
        <Link href="/goals" className="text-primary underline underline-offset-2">
          Thêm ở trang Mục tiêu
        </Link>
      </p>
    );
  }

  const count = habits.filter((h) => list.includes(h)).length;
  return (
    <div>
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}
      <ul className="flex flex-wrap gap-2">
        {habits.map((name) => {
          const on = list.includes(name);
          return (
            <li key={name}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(today, name, !on)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-primary bg-accent-soft font-medium text-primary"
                    : "border-line text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-4 items-center justify-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-line"}`}
                >
                  {on && <CheckIcon className="size-3" strokeWidth={3} />}
                </span>
                {name}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {count}/{habits.length} hôm nay ·{" "}
        <Link href="/goals" className="underline underline-offset-2 hover:text-foreground">
          xem cả tháng
        </Link>
      </p>
    </div>
  );
}
