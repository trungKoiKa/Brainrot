import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CheckIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { MaybeLink } from "@/components/tasks/maybe-link";
import { TodayPlan, TomorrowPicker } from "@/components/tasks/today-plan";
import { DailyLogCapture, IdeaForm } from "@/components/quick-capture";
import { HabitToday } from "@/components/habits/habit-today";
import { doneHabits, habitsForMonth } from "@/lib/habits";
import { monthOf, periodOf } from "@/lib/period";
import { daysBetween, formatDay, greetingVN, isEveningVN, longDateVN, todayVN } from "@/lib/date";
import { anyStale, getGoals, getHabits, getRecentDailyLogs, getTasks } from "@/lib/db/data";
import { resolveGoals } from "@/lib/db/goal-status";
import { isGoalDone, type Goal } from "@/lib/goals";
import { StaleBanner } from "@/components/stale-banner";
import type { DailyLog, Task } from "@/lib/types";
import { deadlineLabel, upcomingDeadlines, type DeadlineItem } from "@/lib/today";

export default function TodayPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<TodaySkeleton />}>
        <TodayContent />
      </Suspense>
    </div>
  );
}

async function TodayContent() {
  // Ngày giờ thay đổi theo request → render lúc request; dữ liệu đọc thẳng từ database
  await connection();
  const now = new Date();
  const today = todayVN(now);
  // Next up (Calendar) và Kiến thức mới ẩn ở v1.0 (SPEC-v1.0 mục 3), về lại ở v1.1
  const [habitsLoaded, goalsLoaded, ...loaded] = await Promise.all([
    getHabits(),
    getGoals(),
    getTasks(),
    getRecentDailyLogs(),
  ]);
  const [tasks, logs] = loaded.map((l) => l.data) as [Task[], DailyLog[]];
  const todayLog = logs.find((l) => l.date === today) ?? null;
  // Từ 18:00: mở sẵn cụm "Cuối ngày" (Daily Log chưa ghi + chọn việc ngày mai)
  const evening = isEveningVN(now);
  // Mục tiêu tuần Ưu tiên dưới "Hôm nay làm" (SPEC-v0.4 mục 7)
  const week = periodOf("week", today);
  const weekGoals = await resolveGoals(
    goalsLoaded.data.filter((g) => g.level === "week" && g.start === week.start && g.type === "Ưu tiên" && g.title.trim()),
  );

  return (
    <>
      <PageHeader
        title={`${greetingVN(now)}, Trung`}
        subtitle={
          <>
            {longDateVN(now)}
            <ThesisCountdown today={today} />
          </>
        }
      />
      <StaleBanner show={anyStale(habitsLoaded, goalsLoaded, ...weekGoals.loaded, ...loaded)} />
      {/* "Hôm nay làm" là tiêu điểm: rộng hết hàng, đứng đầu (critique 06/11/2026, Trung chốt) */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TodayPlanCard today={today} tasks={tasks} weekGoals={weekGoals.goals} />
        <DeadlinesCard items={upcomingDeadlines(today, tasks)} />
        <Card title="Thói quen hôm nay">
          <HabitToday
            habits={habitsForMonth(habitsLoaded.data, monthOf(today)).map((h) => h.name)}
            done={todayLog ? doneHabits(todayLog) : []}
            today={today}
          />
        </Card>
        <Card title="Ghi nhanh" className="lg:col-span-2">
          <IdeaForm />
        </Card>
        <Card title="Cuối ngày" className="lg:col-span-2">
          <div className="space-y-6">
            <DailyLogCapture todayLog={todayLog} open={evening && !todayLog} showExercise={false} />
            <TomorrowPicker today={today} tasks={tasks} open={evening} />
          </div>
        </Card>
      </div>
    </>
  );
}

/** Đếm ngược đồ án, nằm ở dòng phụ dưới lời chào. Chưa đặt hạn thì không hiện gì. */
function ThesisCountdown({ today }: { today: string }) {
  const deadline = process.env.THESIS_DEADLINE;
  if (!deadline) return null;
  const days = daysBetween(today, deadline);
  const date = formatDay(deadline, true);
  return (
    <>
      {" · "}
      {days > 0 ? (
        <>
          còn <span className="font-medium text-primary tabular-nums">{days} ngày</span> đến hạn nộp đồ án ({date})
        </>
      ) : days === 0 ? (
        <span className="font-medium text-danger">hôm nay là hạn nộp đồ án ({date})</span>
      ) : (
        <>
          đã qua hạn nộp đồ án {-days} ngày ({date})
        </>
      )}
    </>
  );
}

/** "Hôm nay làm" (SPEC-v0.5 4.2) + mục tiêu tuần Ưu tiên ở cuối (SPEC-v0.4 mục 7). */
function TodayPlanCard({ today, tasks, weekGoals }: { today: string; tasks: Task[]; weekGoals: Goal[] }) {
  return (
    <Card
      title="Hôm nay làm"
      className="lg:col-span-2"
      action={
        <Link href="/goals?level=week" className="text-xs text-muted-foreground hover:text-primary">
          Cả tuần
        </Link>
      }
    >
      <TodayPlan today={today} tasks={tasks} />
      {weekGoals.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 flex items-baseline justify-between text-xs text-muted-foreground">
            <span className="font-medium">Mục tiêu tuần</span>
            <Link href="/goals?level=week" className="hover:text-foreground">
              Mở
            </Link>
          </p>
          <ul className="space-y-1 text-sm">
            {weekGoals.map((g) => (
              <li key={g.id} className={`flex items-start gap-2 ${isGoalDone(g) ? "text-muted-foreground line-through" : ""}`}>
                {isGoalDone(g) ? (
                  <CheckIcon aria-label="Đã xong" className="mt-[3px] size-3.5 shrink-0 text-success" />
                ) : (
                  <span aria-hidden="true" className="mx-1 mt-[7px] size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                )}
                <span>{g.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function DeadlinesCard({ items }: { items: DeadlineItem[] }) {
  return (
    <Card title="Deadline 14 ngày tới">
      {items.length === 0 ? (
        <Empty>Không có deadline nào trong 14 ngày tới.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((t) => {
            const overdue = t.daysLeft < 0;
            return (
              <li key={t.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <TaskLink task={t} className={overdue ? "text-danger" : undefined} />
                <span
                  className={`shrink-0 text-xs ${
                    overdue ? "rounded-full bg-danger-soft px-2 py-0.5 font-medium text-danger" : t.daysLeft === 0 ? "font-medium text-primary" : "text-muted-foreground"
                  }`}
                >
                  {deadlineLabel(t.daysLeft)} · {formatDay(t.deadline, true)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function TaskLink({ task, className = "" }: { task: Task; className?: string }) {
  return (
    <MaybeLink href={task.url} className={`hover:text-primary ${className}`}>
      {task.title || "(Chưa đặt tên)"}
      {task.project && <span className="ml-2 text-xs text-muted-foreground">{task.project}</span>}
    </MaybeLink>
  );
}

function TodaySkeleton() {
  return (
    <>
      <PageHeader title="Hôm nay" subtitle="Đang tải…" />
      {/* Cùng khung với trang thật: Hôm nay làm (rộng) · Deadline + Thói quen · Ghi nhanh · Cuối ngày */}
      <div className="grid gap-5 lg:grid-cols-2">
        {["h-48 lg:col-span-2", "h-36", "h-36", "h-28 lg:col-span-2", "h-28 lg:col-span-2"].map((size, i) => (
          <div key={i} className={`animate-pulse rounded-xl border border-line bg-surface ${size}`} />
        ))}
      </div>
    </>
  );
}
