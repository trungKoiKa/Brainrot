import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Card } from "@/components/card";
import { HabitMonth } from "@/components/habits/habit-month";
import { PageHeader } from "@/components/page-header";
import { StaleBanner } from "@/components/stale-banner";
import { todayVN } from "@/lib/date";
import { doneHabits } from "@/lib/habits";
import { anyStale, getDailyLogsBetween, getHabits } from "@/lib/notion/data";
import { habitsConfigured } from "@/lib/notion/queries";
import { daysOfMonth, isMonthKey, monthLabel, monthOf, shiftMonth } from "@/lib/period";

// SPEC-v0.4 mục 6. Bước 1 mới có chế độ Tháng (bảng thói quen); Năm/Quý/Tuần đến ở các bước sau.
const LEVELS = [
  { key: "year", label: "Năm" },
  { key: "quarter", label: "Quý" },
  { key: "month", label: "Tháng" },
  { key: "week", label: "Tuần" },
] as const;

const href = (period: string) => `/goals?level=month&period=${period}`;

export default function GoalsPage({ searchParams }: PageProps<"/goals">) {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Mục tiêu" subtitle="Mục tiêu, thói quen và nhìn lại theo năm · quý · tháng · tuần." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <GoalsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GoalsContent({ searchParams }: Pick<PageProps<"/goals">, "searchParams">) {
  await connection(); // tháng hiện tại và ô tích được phụ thuộc ngày hôm nay
  const today = todayVN();
  const { period } = await searchParams;
  const month = typeof period === "string" && isMonthKey(period) ? period : monthOf(today);
  const days = daysOfMonth(month);

  const [habits, logs] = await Promise.all([getHabits(), getDailyLogsBetween(days[0], days[days.length - 1])]);
  const doneByDay: Record<string, string[]> = {};
  for (const log of logs.data) if (log.date) doneByDay[log.date] = doneHabits(log);

  return (
    <div className="space-y-5">
      <StaleBanner show={anyStale(habits, logs)} />
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Cấp" className="flex rounded-full border border-line bg-surface p-0.5">
          {LEVELS.map((l) =>
            l.key === "month" ? (
              <span key={l.key} aria-current="true" className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-primary">
                {l.label}
              </span>
            ) : (
              <span key={l.key} title="Sắp có" className="cursor-not-allowed px-3 py-1 text-sm text-muted-foreground/50">
                {l.label}
              </span>
            ),
          )}
        </div>
        <nav aria-label="Đổi tháng" className="ml-auto flex items-center gap-1">
          <Link href={href(shiftMonth(month, -1))} aria-label="Tháng trước" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <ChevronLeftIcon className="size-4" />
          </Link>
          <span className="min-w-32 text-center font-serif text-lg font-semibold">{monthLabel(month)}</span>
          <Link href={href(shiftMonth(month, 1))} aria-label="Tháng sau" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <ChevronRightIcon className="size-4" />
          </Link>
          {month !== monthOf(today) && (
            <Link href={href(monthOf(today))} className="ml-2 rounded-full border border-line px-3 py-1 text-sm hover:border-primary">
              Tháng này
            </Link>
          )}
        </nav>
      </div>

      {habitsConfigured() ? (
        // key theo tháng → đổi tháng thì bảng nạp lại dữ liệu mới, không giữ trạng thái tháng cũ
        <HabitMonth key={month} month={month} today={today} habits={habits.data} doneByDay={doneByDay} />
      ) : (
        <Card title="Thói quen">
          <p className="text-sm text-muted-foreground">Chưa kết nối database Habits — thêm biến môi trường NOTION_HABITS_DB.</p>
        </Card>
      )}
    </div>
  );
}
