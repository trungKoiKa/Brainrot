import { Suspense } from "react";
import { connection } from "next/server";
import { Card, Empty } from "@/components/card";
import { FieldBadge } from "@/components/field-badge";
import { PageHeader } from "@/components/page-header";
import { TopTasks } from "@/components/tasks/top-tasks";
import { QuickCapture } from "@/components/quick-capture";
import { daysBetween, formatDay, greetingVN, longDateVN, todayVN } from "@/lib/date";
import { anyStale, getKnowledge, getRecentDailyLogs, getTasks } from "@/lib/notion/data";
import { StaleBanner } from "@/components/stale-banner";
import type { DailyLog, Knowledge, Task } from "@/lib/notion/types";
import {
  deadlineLabel,
  latestKnowledge,
  pickTopThree,
  upcomingDeadlines,
  type DeadlineItem,
  type TopThree,
} from "@/lib/today";

export default function TodayPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<TodaySkeleton />}>
        <TodayContent />
      </Suspense>
    </div>
  );
}

async function TodayContent() {
  // Ngày giờ thay đổi theo request → render lúc request; dữ liệu Notion vẫn lấy từ cache 5 phút
  await connection();
  const now = new Date();
  const today = todayVN(now);
  const loaded = await Promise.all([getTasks(), getKnowledge(), getRecentDailyLogs()]);
  const [tasks, knowledge, logs] = loaded.map((l) => l.data) as [Task[], Knowledge[], DailyLog[]];

  return (
    <>
      <PageHeader title={`${greetingVN(now)}, Trung`} subtitle={longDateVN(now)} />
      <StaleBanner show={anyStale(...loaded)} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ThesisCountdown today={today} />
        <TopThreeCard top={pickTopThree(today, logs, tasks)} />
        <DeadlinesCard items={upcomingDeadlines(today, tasks)} />
        <KnowledgeCard notes={latestKnowledge(knowledge)} />
        <Card title="Ghi nhanh" className="lg:col-span-2">
          <QuickCapture todayLog={logs.find((l) => l.date === today) ?? null} />
        </Card>
      </div>
    </>
  );
}

function ThesisCountdown({ today }: { today: string }) {
  const deadline = process.env.THESIS_DEADLINE;
  if (!deadline) {
    return (
      <Card className="lg:col-span-2">
        <Empty>Chưa đặt THESIS_DEADLINE.</Empty>
      </Card>
    );
  }
  const days = daysBetween(today, deadline);
  return (
    <Card className="lg:col-span-2">
      <p className="text-muted">Đồ án tốt nghiệp</p>
      <p className="mt-1 font-serif text-2xl md:text-3xl">
        {days > 0 ? (
          <>
            Còn <span className="font-semibold text-accent">{days} ngày</span> đến hạn nộp đồ án ({formatDay(deadline)})
          </>
        ) : days === 0 ? (
          <span className="font-semibold text-danger">Hôm nay là hạn nộp đồ án ({formatDay(deadline)})</span>
        ) : (
          <span className="text-muted">Đã qua hạn nộp đồ án {-days} ngày ({formatDay(deadline)})</span>
        )}
      </p>
    </Card>
  );
}

function TopThreeCard({ top }: { top: TopThree }) {
  return (
    <Card
      title="3 việc hôm nay"
      action={
        top.source === "daily" ? (
          <ExternalLink href={top.logUrl} className="text-xs text-muted hover:text-accent">
            Từ Daily Log hôm qua ↗
          </ExternalLink>
        ) : (
          <span className="text-xs text-muted">Từ Tasks</span>
        )
      }
    >
      {top.items.length === 0 ? (
        <Empty>Không còn việc nào chưa xong.</Empty>
      ) : top.source === "daily" ? (
        <ol className="space-y-2">
          {top.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <Index n={i + 1} />
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <TopTasks tasks={top.items} />
      )}
    </Card>
  );
}

function DeadlinesCard({ items }: { items: DeadlineItem[] }) {
  return (
    <Card title="Deadline 14 ngày tới">
      {items.length === 0 ? (
        <Empty>Không có deadline nào trong 14 ngày tới.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((t) => {
            const overdue = t.daysLeft < 0;
            return (
              <li key={t.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <TaskLink task={t} className={overdue ? "text-danger" : undefined} />
                <span
                  className={`shrink-0 text-xs ${
                    overdue ? "rounded-full bg-danger-soft px-2 py-0.5 font-medium text-danger" : t.daysLeft === 0 ? "font-medium text-accent" : "text-muted"
                  }`}
                >
                  {deadlineLabel(t.daysLeft)} · {formatDay(t.deadline, true)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function KnowledgeCard({ notes }: { notes: Knowledge[] }) {
  return (
    <Card title="Kiến thức mới">
      {notes.length === 0 ? (
        <Empty>Chưa có ghi chú kiến thức nào.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {notes.map((k) => (
            <li key={k.id} className="py-2 first:pt-0 last:pb-0">
              <ExternalLink href={k.url} className="font-medium hover:text-accent">
                {k.title || "(Chưa đặt tên)"}
              </ExternalLink>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <FieldBadge field={k.field} />
                {k.level && <span>{k.level}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TaskLink({ task, className = "" }: { task: Task; className?: string }) {
  return (
    <ExternalLink href={task.url} className={`hover:text-accent ${className}`}>
      {task.title || "(Chưa đặt tên)"}
      {task.project && <span className="ml-2 text-xs text-muted">{task.project}</span>}
    </ExternalLink>
  );
}

function ExternalLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function Index({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
      {n}
    </span>
  );
}

function TodaySkeleton() {
  return (
    <>
      <PageHeader title="Today" subtitle="Đang tải từ Notion…" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-36 animate-pulse rounded-2xl border border-line bg-surface ${i === 0 ? "h-24 lg:col-span-2" : ""}`}
          />
        ))}
      </div>
    </>
  );
}
