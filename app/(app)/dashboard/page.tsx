import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { StaleBanner } from "@/components/stale-banner";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { toVNDate, todayVN } from "@/lib/date";
import type { DashInput } from "@/lib/dashboard/stats";
import { anyStale, getDailyLogs90, getGoals, getHabits, getKnowledge, getReflections, getTasks } from "@/lib/db/data";
import { resolveGoals } from "@/lib/db/goal-status";
import { periodOf } from "@/lib/period";
import { reflectionOf } from "@/lib/reflections";
import { getBrainGraph } from "@/lib/db/graph";
import { doneHabits, LEGACY_EXERCISE } from "@/lib/habits";
import { splitLines } from "@/lib/today";

// SPEC-v0.3: tổng quan việc và học tập. Chỉ đọc; v0.5 bỏ Planner, mọi việc đọc từ bảng tasks.
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Dashboard" subtitle="Tổng quan việc và học tập." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  await connection(); // số liệu tính theo ngày hôm nay
  const today = todayVN();
  const [tasks, knowledge, logs, habits, goals, reflections, { stale: graphStale, ...graph }] = await Promise.all([
    getTasks(),
    getKnowledge(),
    getDailyLogs90(),
    getHabits(),
    getGoals(),
    getReflections(),
    getBrainGraph(),
  ]);
  // Châm ngôn năm (SPEC-v0.4 mục 5) dưới tiêu đề
  const motto = reflectionOf(reflections.data, periodOf("year", today))?.motto.trim() || null;
  const month = periodOf("month", today);
  const monthGoals = await resolveGoals(goals.data.filter((g) => g.level === "month" && g.start === month.start));

  const real: DashInput = {
    today,
    thesisDeadline: process.env.THESIS_DEADLINE ?? null,
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
    knowledge: knowledge.data.map((k) => k.learnedOn ?? toVNDate(k.createdTime)),
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
      {motto && <p className="-mt-5 mb-6 font-serif text-lg text-muted-foreground italic">“{motto}”</p>}
      <StaleBanner show={graphStale || anyStale(tasks, knowledge, logs, habits, goals, reflections, ...monthGoals.loaded)} />
      <DashboardClient real={real} graph={graph} />
    </>
  );
}
