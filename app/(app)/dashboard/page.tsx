import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { StaleBanner } from "@/components/stale-banner";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { toVNDate, todayVN } from "@/lib/date";
import type { DashInput } from "@/lib/dashboard/stats";
import { anyStale, getDailyLogs90, getGoals, getHabits, getKnowledge, getTasks } from "@/lib/notion/data";
import { resolveGoals } from "@/lib/notion/goal-status";
import { periodOf } from "@/lib/period";
import { getBrainGraph } from "@/lib/notion/graph";
import { doneHabits, LEGACY_EXERCISE } from "@/lib/habits";
import { splitLines } from "@/lib/today";

// SPEC-v0.3: tổng quan việc và học tập. Chỉ đọc; Planner đọc ở trình duyệt (localStorage).
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
  const [tasks, knowledge, logs, habits, goals, { stale: graphStale, ...graph }] = await Promise.all([
    getTasks(),
    getKnowledge(),
    getDailyLogs90(),
    getHabits(),
    getGoals(),
    getBrainGraph(),
  ]);
  const month = periodOf("month", today);
  const monthGoals = await resolveGoals(goals.data.filter((g) => g.level === "month" && g.start === month.start));

  const real: Omit<DashInput, "planner"> = {
    today,
    thesisDeadline: process.env.THESIS_DEADLINE ?? null,
    tasks: tasks.data.map((t) => ({
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
      <StaleBanner show={graphStale || anyStale(tasks, knowledge, logs, habits, goals, ...monthGoals.loaded)} />
      <DashboardClient real={real} graph={graph} />
    </>
  );
}
