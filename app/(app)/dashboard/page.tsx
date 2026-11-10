import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StaleBanner } from "@/components/stale-banner";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { toVNDate, todayVN } from "@/lib/date";
import type { DashInput } from "@/lib/dashboard/stats";
import { anyStale, getDailyLogs90, getGoals, getHabits, getProfile, getReflections, getTasks } from "@/lib/db/data";
import { resolveGoals } from "@/lib/db/goal-status";
import { periodOf } from "@/lib/period";
import { reflectionOf } from "@/lib/reflections";
import { doneHabits, LEGACY_EXERCISE } from "@/lib/habits";
import { splitLines } from "@/lib/today";

// SPEC-v0.3: "Tôi đang làm tốt không?". Chỉ đọc; v0.5 bỏ Planner; v1.0 ẩn Brain + Knowledge (SPEC-v1.0 mục 3).
export default function DashboardPage() {
  return (
    <div>
      <PageHeader kicker="TỔNG QUAN" title="Dashboard" subtitle="Tôi đang làm tốt không?" />
      <Suspense fallback={<Skeleton className="h-96 rounded-none" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  await connection(); // số liệu tính theo ngày hôm nay
  const today = todayVN();
  const [profile, tasks, logs, habits, goals, reflections] = await Promise.all([
    getProfile(),
    getTasks(),
    getDailyLogs90(),
    getHabits(),
    getGoals(),
    getReflections(),
  ]);
  // Châm ngôn năm (SPEC-v0.4 mục 5) dưới tiêu đề
  const motto = reflectionOf(reflections.data, periodOf("year", today))?.motto.trim() || null;
  const month = periodOf("month", today);
  const monthGoals = await resolveGoals(goals.data.filter((g) => g.level === "month" && g.start === month.start));

  const real: DashInput = {
    today,
    thesisDeadline: profile.target.date,
    thesisLabel: profile.target.label,
    tasks: tasks.data.map((t) => ({
      title: t.title,
      url: t.url,
      plannedOn: t.plannedOn,
      project: t.project,
      status: t.status,
      deadline: t.deadline,
      doneOn: t.doneOn,
      createdOn: toVNDate(t.createdTime),
    })),
    logs: logs.data.flatMap((l) => {
      if (!l.date) return [];
      const habitsDone = doneHabits(l);
      return [
        {
          date: l.date,
          doneCount: splitLines(l.done).length,
          exercised: habitsDone.includes(LEGACY_EXERCISE),
          dropped: l.dropped.trim() !== "",
          habits: habitsDone,
        },
      ];
    }),
    habits: habits.data,
    monthGoals: monthGoals.goals,
  };

  return (
    <>
      {motto && <p className="-mt-3 mb-6 text-base text-muted-foreground italic">“{motto}”</p>}
      <StaleBanner show={anyStale(tasks, logs, habits, goals, reflections, ...monthGoals.loaded)} />
      <DashboardClient real={real} />
    </>
  );
}
