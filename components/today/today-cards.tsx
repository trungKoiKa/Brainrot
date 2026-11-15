// Các thẻ của Today (SPEC.md mục 5.1): kế hoạch hôm nay, sắp đến hạn, kiến thức mới, khung chờ khi tải.

import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayPlan } from "@/components/tasks/today-plan";
import { formatDay } from "@/lib/date";
import { isGoalDone, type Goal } from "@/lib/goals";
import type { Knowledge, Task } from "@/lib/types";
import { planToday, type DeadlineItem } from "@/lib/today";
import { noteDay } from "@/lib/knowledge";
import { colorVarByOrder } from "@/lib/topic-colors";
import { Pill } from "@/components/pill";

/** "Hôm nay làm" (SPEC.md mục 5.1) + mục tiêu tuần Ưu tiên ở cuối (SPEC.md mục 5.1). */
export function TodayPlanCard({ today, tasks, projects, weekGoals }: { today: string; tasks: Task[]; projects: string[]; weekGoals: Goal[] }) {
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

export function DeadlinesCard({ items }: { items: DeadlineItem[] }) {
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
export function LatestNotesCard({ notes, fields }: { notes: Knowledge[]; fields: string[] }) {
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

export function TodaySkeleton() {
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

/** Nhãn mono đếm ngày tới hạn: T-03 (còn 3 ngày), T-00 (hôm nay), T+2 (quá 2 ngày). */
const tLabel = (d: number) => (d < 0 ? `T+${-d}` : `T-${String(d).padStart(2, "0")}`);
