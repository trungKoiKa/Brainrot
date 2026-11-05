import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Card, Empty } from "@/components/card";
import { FieldBadge } from "@/components/field-badge";
import { PageHeader } from "@/components/page-header";
import { MaybeLink } from "@/components/tasks/maybe-link";
import { TodayPlan, TomorrowPicker } from "@/components/tasks/today-plan";
import { QuickCapture } from "@/components/quick-capture";
import { HabitToday } from "@/components/habits/habit-today";
import { doneHabits, habitsForMonth } from "@/lib/habits";
import { monthOf, periodOf } from "@/lib/period";
import { daysBetween, formatDay, greetingVN, longDateVN, todayVN } from "@/lib/date";
import { calendarEvents, type CalendarResult } from "@/lib/calendar/google";
import { pickNextUp, timeRange } from "@/lib/next-up";
import { anyStale, getGoals, getHabits, getKnowledge, getRecentDailyLogs, getTasks } from "@/lib/db/data";
import { resolveGoals } from "@/lib/db/goal-status";
import { isGoalDone, type Goal } from "@/lib/goals";
import { StaleBanner } from "@/components/stale-banner";
import type { DailyLog, Knowledge, Task } from "@/lib/types";
import {
  deadlineLabel,
  latestKnowledge,
  upcomingDeadlines,
  type DeadlineItem,
} from "@/lib/today";

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
  const [calendar, habitsLoaded, goalsLoaded, ...loaded] = await Promise.all([
    calendarEvents(today),
    getHabits(),
    getGoals(),
    getTasks(),
    getKnowledge(),
    getRecentDailyLogs(),
  ]);
  const [tasks, knowledge, logs] = loaded.map((l) => l.data) as [Task[], Knowledge[], DailyLog[]];
  const todayLog = logs.find((l) => l.date === today) ?? null;
  // Mục tiêu tuần Ưu tiên dưới "Hôm nay làm" (SPEC-v0.4 mục 7)
  const week = periodOf("week", today);
  const weekGoals = await resolveGoals(
    goalsLoaded.data.filter((g) => g.level === "week" && g.start === week.start && g.type === "Ưu tiên" && g.title.trim()),
  );

  return (
    <>
      <PageHeader title={`${greetingVN(now)}, Trung`} subtitle={longDateVN(now)} />
      <StaleBanner show={anyStale(habitsLoaded, goalsLoaded, ...weekGoals.loaded, ...loaded)} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ThesisCountdown today={today} />
        <TodayPlanCard today={today} tasks={tasks} weekGoals={weekGoals.goals} />
        <NextUpCard calendar={calendar} now={now} today={today} />
        <DeadlinesCard items={upcomingDeadlines(today, tasks)} />
        <KnowledgeCard notes={latestKnowledge(knowledge)} />
        <Card title="Thói quen hôm nay" className="lg:col-span-2">
          <HabitToday
            habits={habitsForMonth(habitsLoaded.data, monthOf(today)).map((h) => h.name)}
            done={todayLog ? doneHabits(todayLog) : []}
            today={today}
          />
        </Card>
        <Card title="Ghi nhanh" className="lg:col-span-2">
          <div className="space-y-6">
            <QuickCapture todayLog={todayLog} showExercise={false} />
            <TomorrowPicker today={today} tasks={tasks} />
          </div>
        </Card>
      </div>
    </>
  );
}

function ThesisCountdown({ today }: { today: string }) {
  const deadline = process.env.THESIS_DEADLINE;
  if (!deadline) {
    return (
      <Card className="lg:col-span-2">
        <Empty>Chưa đặt THESIS_DEADLINE.</Empty>
      </Card>
    );
  }
  const days = daysBetween(today, deadline);
  return (
    <Card className="lg:col-span-2">
      <p className="text-muted-foreground">Đồ án tốt nghiệp</p>
      <p className="mt-1 font-serif text-2xl md:text-3xl">
        {days > 0 ? (
          <>
            Còn <span className="font-semibold text-primary">{days} ngày</span> đến hạn nộp đồ án ({formatDay(deadline)})
          </>
        ) : days === 0 ? (
          <span className="font-semibold text-danger">Hôm nay là hạn nộp đồ án ({formatDay(deadline)})</span>
        ) : (
          <span className="text-muted-foreground">Đã qua hạn nộp đồ án {-days} ngày ({formatDay(deadline)})</span>
        )}
      </p>
    </Card>
  );
}

/** "Hôm nay làm" (SPEC-v0.5 4.2) + mục tiêu tuần Ưu tiên ở cuối (SPEC-v0.4 mục 7). */
function TodayPlanCard({ today, tasks, weekGoals }: { today: string; tasks: Task[]; weekGoals: Goal[] }) {
  return (
    <Card
      title="Hôm nay làm"
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
              <li key={g.id} className={isGoalDone(g) ? "text-muted-foreground line-through" : ""}>
                {isGoalDone(g) ? "✓ " : "• "}
                {g.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function NextUpCard({ calendar, now, today }: { calendar: CalendarResult; now: Date; today: string }) {
  if (!calendar.ok) {
    const message = {
      "not-configured": "Chưa kết nối Google Calendar (thiếu biến GOOGLE_*).",
      auth: "Google từ chối quyền đọc lịch — refresh token có thể đã hết hạn hoặc bị thu hồi.",
      error: "Không đọc được Google Calendar, thử lại sau.",
    }[calendar.reason];
    return (
      <Card title="Next up">
        <Empty>{message}</Empty>
      </Card>
    );
  }
  const { day, items } = pickNextUp(calendar.events, now, today);
  return (
    <Card title="Next up" action={<span className="text-xs text-muted-foreground">{day === "today" ? "Hôm nay" : "Ngày mai"}</span>}>
      {items.length === 0 ? (
        <Empty>Hôm nay và ngày mai không còn sự kiện nào.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((e) => (
            <li key={e.id} className="flex gap-3 py-2 first:pt-0 last:pb-0">
              <span className="w-24 shrink-0 text-xs leading-6 tabular-nums text-muted-foreground">{timeRange(e)}</span>
              <div className="min-w-0 flex-1">
                {e.url ? (
                  <ExternalLink href={e.url} className="hover:text-primary">
                    {e.title}
                  </ExternalLink>
                ) : (
                  e.title
                )}
                {(e.ongoing || e.location || e.meetUrl) && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {e.ongoing && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-primary">Đang diễn ra</span>}
                    {e.meetUrl && (
                      <ExternalLink href={e.meetUrl} className="text-primary hover:underline">
                        Vào họp ↗
                      </ExternalLink>
                    )}
                    {e.location && <span className="truncate">{e.location}</span>}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
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

function KnowledgeCard({ notes }: { notes: Knowledge[] }) {
  return (
    <Card title="Kiến thức mới">
      {notes.length === 0 ? (
        <Empty>Chưa có ghi chú kiến thức nào.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {notes.map((k) => (
            <li key={k.id} className="py-2 first:pt-0 last:pb-0">
              <ExternalLink href={k.url} className="font-medium hover:text-primary">
                {k.title || "(Chưa đặt tên)"}
              </ExternalLink>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <FieldBadge field={k.field} />
                {k.level && <span>{k.level}</span>}
              </div>
            </li>
          ))}
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

function ExternalLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function TodaySkeleton() {
  return (
    <>
      <PageHeader title="Today" subtitle="Đang tải…" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-36 animate-pulse rounded-2xl border border-line bg-surface ${i === 0 ? "h-24 lg:col-span-2" : ""}`}
          />
        ))}
      </div>
    </>
  );
}
