import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { TaskBoard } from "@/components/tasks/task-board";
import { todayVN } from "@/lib/date";
import { StaleBanner } from "@/components/stale-banner";
import { getTaskProjects, getTasks } from "@/lib/notion/data";

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tasks" subtitle="Việc chưa xong, nhóm theo dự án. Bấm ✎ để sửa; xóa task trong Notion." />
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
  const { data, stale } = await getTasks();
  const projects = await getTaskProjects(data);
  return (
    <>
      <StaleBanner show={stale} />
      <TaskBoard tasks={data} projects={projects} today={todayVN()} initialProject={typeof project === "string" ? project : null} />
    </>
  );
}
