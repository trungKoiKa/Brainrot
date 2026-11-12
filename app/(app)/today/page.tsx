import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CheckIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Readouts } from "@/components/readout";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayPlan, TomorrowPicker } from "@/components/tasks/today-plan";
import { DailyLogCapture, IdeaForm } from "@/components/quick-capture";
import { HabitToday } from "@/components/habits/habit-today";
import { doneHabits, habitsForMonth } from "@/lib/habits";
import { monthOf, periodOf } from "@/lib/period";
import { addDays, daysBetween, formatDay, greetingVN, isEveningVN, longDateVN, workdayClock, workdayVN } from "@/lib/date";
import { anyStale, getGoals, getHabits, getKnowledge, getKnowledgeFields, getProfile, getRecentDailyLogs, getTaskProjects, getTasks } from "@/lib/db/data";
import { resolveGoals } from "@/lib/db/goal-status";
import { isGoalDone, type Goal } from "@/lib/goals";
import { StaleBanner } from "@/components/stale-banner";
import type { DailyLog, Knowledge, Task } from "@/lib/types";
import { latestKnowledge, planToday, todayProgress, upcomingDeadlines, type DeadlineItem } from "@/lib/today";
import { noteDay } from "@/lib/knowledge";
import { colorVarByOrder } from "@/lib/topic-colors";
import { Pill } from "@/components/pill";

// Today theo hướng "Nhật ký kỹ thuật" (DESIGN.md, redesign 11/2026): hàng chỉ số → "Hôm nay làm" | cột phụ (thói quen, hạn)
export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <TodayContent />
    </Suspense>
  );
}

async function TodayContent() {
  // Ngày giờ thay đổi theo request → render lúc request; dữ liệu đọc thẳng từ database
  await connection();
  const now = new Date();
  // Today đổi ngày lúc 4:00 (Trung chốt 06/11/2026): 0:00–3:59 vẫn là tối hôm trước
  const today = workdayVN(now);
  const [profile, habitsLoaded, goalsLoaded, projects, notesLoaded, fields, ...loaded] = await Promise.all([
    getProfile(),
    getHabits(),
    getGoals(),
    getTaskProjects(),
    getKnowledge(),
    getKnowledgeFields(),
    getTasks(),
    getRecentDailyLogs(),
  ]);
  const [tasks, logs] = loaded.map((l) => l.data) as [Task[], DailyLog[]];
  const todayLog = logs.find((l) => l.date === today) ?? null;
  // 18:00–3:59: cụm "Cuối ngày" lên ngay dưới "Hôm nay làm" và mở sẵn
  const evening = isEveningVN(now);
  const week = periodOf("week", today);
  const weekGoals = await resolveGoals(
    goalsLoaded.data.filter((g) => g.level === "week" && g.start === week.start && g.type === "Ưu tiên" && g.title.trim()),
  );

  const plan = planToday(today, tasks);
  const progress = todayProgress(today, tasks);
  const habits = habitsForMonth(habitsLoaded.data, monthOf(today)).map((h) => h.name);
  const habitsDone = todayLog ? doneHabits(todayLog).filter((h) => habits.includes(h)).length : 0;
  // Hạn sắp tới: bỏ việc đã nằm trong "Hôm nay làm" để không lặp (rà soát A1 P1)
  const inPlan = new Set([...plan.planned, ...plan.late, ...plan.due].map((t) => t.id));
  const deadlines = upcomingDeadlines(today, tasks).filter((t) => !inPlan.has(t.id));
  const target = profile.target.date ? { days: daysBetween(today, profile.target.date), ...profile.target } : null;

  const endOfDay = (
    <Card title="Cuối ngày">
      <div className="flex flex-col gap-2">
        <DailyLogCapture todayLog={todayLog} open={evening && !todayLog} showExercise={false} day={today} />
        <TomorrowPicker today={today} tasks={tasks} open={evening} />
      </div>
    </Card>
  );

  return (
    <>
      <PageHeader kicker={`NHẬT KÝ · ${today}`} title={`${greetingVN(now)}, ${givenName(profile.name)}`} aside={longDateVN(workdayClock(now))} />
      <StaleBanner show={anyStale(habitsLoaded, goalsLoaded, notesLoaded, ...weekGoals.loaded, ...loaded)} />

      <Readouts
        className="mb-6"
        items={[
          { label: "Việc hôm nay", value: progress ? `${progress.done}/${progress.total}` : "0/0", note: "việc xếp hôm nay (không tính trễ)" },
          { label: "Trễ lịch", value: String(plan.late.length).padStart(2, "0"), note: "việc có Ngày làm đã qua" },
          { label: "Thói quen", value: `${habitsDone}/${habits.length}`, note: "đã tích hôm nay" },
          target
            ? {
                label: "Đếm ngược",
                value: target.days >= 0 ? `D-${target.days}` : `D+${-target.days}`,
                note: `${target.label} · ${formatDay(target.date as string, true)}`,
                accent: true,
              }
            : { label: "Đếm ngược", value: "—", note: <Link href="/settings" className="underline underline-offset-2">đặt hạn ở Cài đặt</Link> },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <TodayPlanCard today={today} tasks={tasks} projects={projects} weekGoals={weekGoals.goals} />
          {evening && endOfDay}
          <Card title="Ghi nhanh ý tưởng">
            <IdeaForm />
          </Card>
          {!evening && endOfDay}
        </div>

        <aside className="flex min-w-0 flex-col gap-6" aria-label="Thói quen, hạn sắp tới và kiến thức mới">
          <Card title="Thói quen · 7 ngày">
            <HabitToday
              habits={habits}
              doneByDay={Object.fromEntries(logs.flatMap((l) => (l.date && l.date > addDays(today, -7) ? [[l.date, doneHabits(l)]] : [])))}
              today={today}
            />
          </Card>
          <DeadlinesCard items={deadlines} />
          <LatestNotesCard notes={latestKnowledge(notesLoaded.data)} fields={fields} />
        </aside>
      </div>
    </>
  );
}

/** Tên gọi trong lời chào: từ cuối của tên hiển thị ("Anh Trung" → "Trung"); chưa đặt tên → "bạn". */
const givenName = (name: string) => name.trim().split(/\s+/).at(-1) || "bạn";

/** "Hôm nay làm" (SPEC-v0.5 4.2) + mục tiêu tuần Ưu tiên ở cuối (SPEC-v0.4 mục 7). */
function TodayPlanCard({ today, tasks, projects, weekGoals }: { today: string; tasks: Task[]; projects: string[]; weekGoals: Goal[] }) {
  const rows = planToday(today, tasks);
  const count = rows.planned.length + rows.late.length + rows.due.length;
  return (
    <Card title="Hôm nay làm" focal flush action={<span className="text-xs text-muted-foreground tabular-nums">{count} dòng</span>}>
      <TodayPlan today={today} tasks={tasks} projects={projects} />
      {weekGoals.length > 0 && (
        <div className="border-t border-line-soft px-4 py-3">
          <p className="mb-2 flex items-baseline justify-between text-xs text-muted-foreground">
            <span className="font-mono uppercase">Mục tiêu tuần</span>
            <Link href="/goals?level=week" className="hover:text-foreground">
              Mở
            </Link>
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {weekGoals.map((g) => (
              <li key={g.id} className={`flex items-start gap-2 ${isGoalDone(g) ? "text-muted-foreground line-through" : ""}`}>
                {isGoalDone(g) ? (
                  <CheckIcon aria-label="Đã xong" className="mt-[3px] size-3.5 shrink-0 text-good" />
                ) : (
                  <span aria-hidden="true" className="mx-1 mt-[7px] size-1.5 shrink-0 bg-muted-foreground" />
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

/** Nhãn mono đếm ngày tới hạn: T-03 (còn 3 ngày), T-00 (hôm nay), T+2 (quá 2 ngày). */
const tLabel = (d: number) => (d < 0 ? `T+${-d}` : `T-${String(d).padStart(2, "0")}`);

function DeadlinesCard({ items }: { items: DeadlineItem[] }) {
  return (
    <Card title="Hạn · 14 ngày" flush>
      {items.length === 0 ? (
        <div className="p-4">
          <Empty>Không còn hạn nào khác trong 14 ngày tới.</Empty>
        </div>
      ) : (
        <ul>
          {items.map((t) => {
            const tone = t.daysLeft < 0 ? "text-danger" : t.daysLeft <= 1 ? "text-warning" : "text-muted-foreground";
            return (
              <li key={t.id} className="row-sep flex items-baseline gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-muted">
                <span className={`w-12 shrink-0 font-mono text-xs ${tone}`} aria-label={t.daysLeft < 0 ? `quá hạn ${-t.daysLeft} ngày` : `còn ${t.daysLeft} ngày`}>
                  {tLabel(t.daysLeft)}
                </span>
                <span className={`min-w-0 flex-1 truncate ${t.daysLeft < 0 ? "text-danger" : ""}`} title={t.title}>
                  {t.title || "(Chưa đặt tên)"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{formatDay(t.deadline, true)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** "Kiến thức mới": 5 ghi chú mới nhất (SPEC.md mục 5.6). Bấm tên mở Knowledge. */
function LatestNotesCard({ notes, fields }: { notes: Knowledge[]; fields: string[] }) {
  return (
    <Card
      title="Kiến thức mới"
      flush
      action={
        <Link href="/knowledge" className="text-xs text-muted-foreground hover:text-foreground">
          Mở
        </Link>
      }
    >
      {notes.length === 0 ? (
        <div className="p-4">
          <Empty>
            Chưa có ghi chú nào.{" "}
            <Link href="/knowledge" className="font-medium text-primary underline-offset-4 hover:underline">
              Ghi điều vừa học ở Knowledge
            </Link>
          </Empty>
        </div>
      ) : (
        <ul>
          {notes.map((n) => (
            <li key={n.id} className="row-sep flex flex-col gap-1 px-4 py-2.5 text-sm transition-colors hover:bg-surface-muted">
              <span className="flex items-baseline gap-3">
                <Link href="/knowledge" className="min-w-0 flex-1 truncate underline-offset-4 hover:underline" title={n.title}>
                  {n.title}
                </Link>
                <span className="font-mono text-xs text-muted-foreground">{formatDay(noteDay(n), true)}</span>
              </span>
              {n.field && (
                <span>
                  <Pill color={`var(${colorVarByOrder(n.field, fields)})`} dot>
                    {n.field}
                  </Pill>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TodaySkeleton() {
  // Cùng bố cục với trang thật (rà soát: Skeleton đúng bố cục, không pulse tự viết)
  return (
    <>
      <PageHeader kicker="NHẬT KÝ" title="Hôm nay" subtitle="Đang tải…" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </>
  );
}
