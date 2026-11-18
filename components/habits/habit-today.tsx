"use client";

import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { ErrorNotice } from "@/components/error-notice";
import { addDays, formatDay, weekdayShort } from "@/lib/date";
import { useHabitDays } from "./use-habit-days";

/**
 * Thói quen trên Today dạng lưới 7 ngày như phương án C (Trung chọn 11/11/2026): mỗi hàng một thói quen, 7 ô vuông
 * cho 6 ngày trước + hôm nay; bấm ô để tích / bỏ tích ngày đó (lưu ngay, như bảng tháng ở Goal — SPEC.md mục 5.3).
 */
export function HabitToday({ habits, doneByDay, today }: { habits: string[]; doneByDay: Record<string, string[]>; today: string }) {
  const { days, toggle, error, dismissError } = useHabitDays(doneByDay);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  if (habits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có thói quen nào cho tháng này.{" "}
        <Link href="/goals?level=month" className="text-primary underline underline-offset-2">
          Thêm ở trang Mục tiêu
        </Link>
      </p>
    );
  }

  const todayCount = habits.filter((h) => (days[today] ?? []).includes(h)).length;
  return (
    <div>
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Thói quen 7 ngày gần nhất, bấm ô để tích</caption>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              Thói quen
            </th>
            {week.map((d) => (
              <th
                key={d}
                scope="col"
                className={`w-7 pb-1.5 text-center font-mono text-xs font-normal ${d === today ? "text-primary" : "text-muted-foreground"}`}
              >
                <abbr title={formatDay(d, true)} className="no-underline">
                  {weekdayShort(d)}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((name) => (
            <tr key={name}>
              <th scope="row" className="max-w-0 truncate py-1 pr-2 text-left font-normal" title={name}>
                {name}
              </th>
              {week.map((d) => {
                const on = (days[d] ?? []).includes(name);
                return (
                  <td key={d} className="px-0.5 py-1 text-center">
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`${name} ${weekdayShort(d)} ${formatDay(d, true)}`}
                      onClick={() => toggle(d, name, !on)}
                      // Bo 4px + khe giữa các ô cho mềm hơn (Trung góp ý 11/11/2026: ô vuông góc trông thô)
                      className={`mx-auto flex size-6 items-center justify-center rounded-[4px] border transition-colors max-md:size-7 ${
                        on ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary"
                      }`}
                    >
                      {on && <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={3} />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="font-mono">
          {todayCount}/{habits.length}
        </span>{" "}
        hôm nay ·{" "}
        <Link href="/goals?level=month" className="underline underline-offset-2 hover:text-foreground">
          xem cả tháng
        </Link>
      </p>
    </div>
  );
}
