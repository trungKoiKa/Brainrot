import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { TaskBoard } from "@/components/tasks/task-board";
import { todayVN } from "@/lib/date";
import { StaleBanner } from "@/components/stale-banner";
import type { GoalOption } from "@/components/tasks/task-forms";
import { getGoals, getTaskProjects, getTasks } from "@/lib/db/data";
import { periodLabel, periodOf } from "@/lib/period";

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tasks" subtitle="Việc chưa xong, nhóm theo dự án. Bấm ✎ để sửa." />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <TasksContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TasksContent({ searchParams }: Pick<PageProps<"/tasks">, "searchParams">) {
  await connection(); // nhãn "Quá hạn / Còn N ngày" phụ thuộc ngày hôm nay
  // ?project= từ Dashboard (SPEC-v0.3 4.2) → lọc sẵn theo dự án
  const { project } = await searchParams;
  const today = todayVN();
  const [{ data, stale }, goals] = await Promise.all([getTasks(), getGoals()]);
  const projects = await getTaskProjects();

  // Mục tiêu gắn được (SPEC-v0.4 4.4): mục tiêu Tháng/Tuần — "open" nếu thuộc tháng/tuần hiện tại và chưa tích xong
  const thisMonth = periodOf("month", today).start;
  const thisWeek = periodOf("week", today).start;
  const goalOptions: GoalOption[] | null = goals.data
        .filter((g) => g.level === "month" || g.level === "week")
        .map((g) => ({
          id: g.id,
          label: `${g.title} · ${periodLabel(periodOf(g.level, g.start)).split(" · ")[0]}`,
          open: !g.done && (g.start === thisMonth || g.start === thisWeek),
        }));

  return (
    <>
      <StaleBanner show={stale || goals.stale} />
      <TaskBoard
        tasks={data}
        projects={projects}
        today={today}
        initialProject={typeof project === "string" ? project : null}
        goals={goalOptions}
      />
    </>
  );
}
