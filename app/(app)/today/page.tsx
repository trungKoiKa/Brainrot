// Today theo hướng "Nhật ký kỹ thuật" (DESIGN.md, redesign 11/2026): hàng chỉ số → "Hôm nay làm" | cột phụ (thói quen, hạn)

import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Readouts } from "@/components/readout";
import { TomorrowPicker } from "@/components/tasks/today-plan";
import { DailyLogCapture, IdeaForm } from "@/components/today/quick-capture";
import { HabitToday } from "@/components/habits/habit-today";
import { doneHabits, habitsForMonth } from "@/lib/habits";
import { monthOf, periodOf } from "@/lib/period";
import { addDays, daysBetween, formatDay, greetingVN, isEveningVN, longDateVN, workdayClock, workdayVN } from "@/lib/date";
import { getGoals, getHabits, getKnowledge, getKnowledgeFields, getProfile, getRecentDailyLogs, getTaskProjects, getTasks } from "@/lib/db/data";
import { resolveGoals } from "@/lib/db/goal-status";
import { latestKnowledge, planToday, todayProgress, upcomingDeadlines } from "@/lib/today";
import { DeadlinesCard, LatestNotesCard, TodayPlanCard, TodaySkeleton } from "../../../components/today/today-cards";

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
  const [profile, allHabits, allGoals, projects, notes, fields, tasks, logs] = await Promise.all([
    getProfile(),
    getHabits(),
    getGoals(),
    getTaskProjects(),
    getKnowledge(),
    getKnowledgeFields(),
    getTasks(),
    getRecentDailyLogs(),
  ]);
  const todayLog = logs.find((l) => l.date === today) ?? null;
  // 18:00–3:59: cụm "Cuối ngày" lên ngay dưới "Hôm nay làm" và mở sẵn
  const evening = isEveningVN(now);
  const week = periodOf("week", today);
  const weekGoals = await resolveGoals(
    allGoals.filter((g) => g.level === "week" && g.start === week.start && g.type === "Ưu tiên" && g.title.trim()),
  );

  const plan = planToday(today, tasks);
  const progress = todayProgress(today, tasks);
  const habits = habitsForMonth(allHabits, monthOf(today)).map((h) => h.name);
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
          <TodayPlanCard today={today} tasks={tasks} projects={projects} weekGoals={weekGoals} />
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
          <LatestNotesCard notes={latestKnowledge(notes)} fields={fields} />
        </aside>
      </div>
    </>
  );
}

/** Tên gọi trong lời chào: từ cuối của tên hiển thị ("Anh Trung" → "Trung"); chưa đặt tên → "bạn". */
const givenName = (name: string) => name.trim().split(/\s+/).at(-1) || "bạn";
