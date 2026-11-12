import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { Readouts } from "@/components/readout";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskBoard } from "@/components/tasks/task-board";
import { addDays, todayVN } from "@/lib/date";
import type { GoalOption } from "@/components/tasks/task-forms";
import { getGoals, getTaskProjects, getTasks } from "@/lib/db/data";
import { periodLabel, periodOf } from "@/lib/period";
import { PRIORITIES } from "@/lib/task-form";

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <>
      <PageHeader kicker="KHO VIỆC" title="Tasks" subtitle="Nơi duy nhất thêm, sửa và xoá việc; việc chưa xong nhóm theo dự án." />
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        }
      >
        <TasksContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TasksContent({ searchParams }: Pick<PageProps<"/tasks">, "searchParams">) {
  await connection(); // nhãn "Quá hạn / Còn N ngày" phụ thuộc ngày hôm nay
  // ?project= từ Dashboard (SPEC.md mục 5.2) → lọc sẵn theo dự án
  const { project, priority } = await searchParams;
  const today = todayVN();
  // Một tầng truy vấn song song (rà soát A4: getTaskProjects từng chạy nối sau)
  const [data, goals, projects] = await Promise.all([getTasks(), getGoals(), getTaskProjects()]);
  const open = data.filter((t) => t.status !== "Xong");
  const in7 = addDays(today, 7);
  const weekAgo = addDays(today, -6);

  // Mục tiêu gắn được (SPEC.md mục 5.2): mục tiêu Tháng/Tuần — "open" nếu thuộc tháng/tuần hiện tại và chưa tích xong
  const thisMonth = periodOf("month", today).start;
  const thisWeek = periodOf("week", today).start;
  const goalOptions: GoalOption[] | null = goals
        .filter((g) => g.level === "month" || g.level === "week")
        .map((g) => ({
          id: g.id,
          label: `${g.title} · ${periodLabel(periodOf(g.level, g.start)).split(" · ")[0]}`,
          open: !g.done && (g.start === thisMonth || g.start === thisWeek),
        }));

  return (
    <>
      <Readouts
        className="mb-6"
        items={[
          { label: "Chưa xong", value: open.length, note: "việc đang mở" },
          { label: "Quá hạn", value: open.filter((t) => t.deadline && t.deadline < today).length, note: "hạn đã qua" },
          { label: "Hạn 7 ngày", value: open.filter((t) => t.deadline && t.deadline >= today && t.deadline <= in7).length, note: "tính cả hôm nay" },
          { label: "Xong 7 ngày", value: data.filter((t) => t.status === "Xong" && t.doneOn && t.doneOn >= weekAgo).length, note: "kể cả hôm nay" },
        ]}
      />
      <TaskBoard
        tasks={data}
        projects={projects}
        today={today}
        initialProject={typeof project === "string" ? project : null}
        initialPriority={PRIORITIES.find((p) => p === priority) ?? null}
        goals={goalOptions}
      />
    </>
  );
}
