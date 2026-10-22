import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { TaskBoard } from "@/components/tasks/task-board";
import { todayVN } from "@/lib/date";
import { StaleBanner } from "@/components/stale-banner";
import { getTaskProjects, getTasks } from "@/lib/notion/data";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tasks" subtitle="Việc chưa xong, nhóm theo dự án. Bấm ✎ để sửa; xóa task trong Notion." />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <TasksContent />
      </Suspense>
    </div>
  );
}

async function TasksContent() {
  await connection(); // nhãn "Quá hạn / Còn N ngày" phụ thuộc ngày hôm nay
  const { data, stale } = await getTasks();
  const projects = await getTaskProjects(data);
  return (
    <>
      <StaleBanner show={stale} />
      <TaskBoard tasks={data} projects={projects} today={todayVN()} />
    </>
  );
}
