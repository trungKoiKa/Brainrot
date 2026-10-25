import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { StaleBanner } from "@/components/stale-banner";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { toVNDate, todayVN } from "@/lib/date";
import type { DashInput } from "@/lib/dashboard/stats";
import { anyStale, getDailyLogs90, getKnowledge, getTasks } from "@/lib/notion/data";
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
  const [tasks, knowledge, logs] = await Promise.all([getTasks(), getKnowledge(), getDailyLogs90()]);

  const real: Omit<DashInput, "planner"> = {
    today: todayVN(),
    thesisDeadline: process.env.THESIS_DEADLINE ?? null,
    tasks: tasks.data.map((t) => ({
      project: t.project,
      status: t.status,
      deadline: t.deadline,
      doneOn: t.doneOn,
      createdOn: toVNDate(t.createdTime),
    })),
    knowledge: knowledge.data.map((k) => k.learnedOn ?? toVNDate(k.createdTime)),
    logs: logs.data.flatMap((l) =>
      l.date ? [{ date: l.date, doneCount: splitLines(l.done).length, exercised: l.exercised, dropped: l.dropped.trim() !== "" }] : [],
    ),
  };

  return (
    <>
      <StaleBanner show={anyStale(tasks, knowledge, logs)} />
      <DashboardClient real={real} />
    </>
  );
}
