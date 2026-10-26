"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Maximize2Icon } from "lucide-react";
import { BrainView } from "@/components/brain/brain-view";
import { Card, Empty } from "@/components/card";
import { Badge } from "@/components/reui/badge";
import { formatDay } from "@/lib/date";
import type { GraphData } from "@/lib/graph-types";
import { sampleDashboard } from "@/lib/dashboard/sample";
import {
  backlogKpi,
  dailyRhythm,
  doneKpi,
  habitKpis,
  hasDoneDates,
  PERIODS,
  plannerKpi,
  plannerLanes,
  tasksByProject,
  thesisKpi,
  weeklyRhythm,
  type DashInput,
  type Period,
  type PlannerSummary,
} from "@/lib/dashboard/stats";
import { projectProgress, weekProgress } from "@/features/planner/lib/progress";
import { usePlanner } from "@/features/planner/store/usePlanner";
import { DailyBars, HabitBars, KpiCard, MonthGoals, PlannerLanes, ProjectBars, SampleBadge, WeeklyArea } from "./dashboard-blocks";

type Mode = "real" | "sample";

const MODE_KEY = "dashboard.mode";
const PERIOD_KEY = "dashboard.period";

function readStored<T>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    const value = allowed.find((a) => String(a) === raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage bị chặn → chỉ nhớ trong phiên
  }
}

/** Dữ liệu Planner của trình duyệt này; chưa có gì → null. */
function usePlannerSummary(): PlannerSummary | null {
  const projects = usePlanner((s) => s.projects);
  const archives = usePlanner((s) => s.archives);
  return useMemo(() => {
    if (projects.length === 0 && archives.length === 0) return null;
    return {
      thisWeek: weekProgress(projects),
      history: [...archives]
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((a) => ({ weekStart: a.weekStart, ...a.totals })),
      projects: projects.map((p) => ({ name: p.title || "Untitled", ...projectProgress(p) })),
    };
  }, [projects, archives]);
}

const fmt = new Intl.NumberFormat("vi-VN");

export function DashboardView({ real: realBase, graph }: { real: Omit<DashInput, "planner">; graph: GraphData }) {
  const [mode, setMode] = useState<Mode>(() => readStored<Mode>(MODE_KEY, ["real", "sample"], "real"));
  const [period, setPeriod] = useState<Period>(() => readStored<Period>(PERIOD_KEY, PERIODS, 30));
  const planner = usePlannerSummary();
  const real: DashInput = { ...realBase, planner };
  const sample = useMemo(
    () => sampleDashboard(realBase.today, realBase.thesisDeadline ?? undefined),
    [realBase.today, realBase.thesisDeadline],
  );

  // Khối nào thiếu nguồn thật thì dùng mẫu (SPEC-v0.3 mục 5)
  const all = mode === "sample";
  const doneSample = all || !hasDoneDates(real.tasks);
  const logsSample = all || real.logs.length === 0;
  const plannerSample = all || real.planner === null;
  const habitsSample = all || real.habits.length === 0;
  // Mục tiêu: chế độ Thật mà chưa đặt mục tiêu tháng → báo trống + link đặt mục tiêu, không dùng mẫu
  const goalsSample = all;
  const tasksSrc = all ? sample : real;
  const doneSrc = doneSample ? sample : real;
  const logsSrc = logsSample ? sample : real;
  const plannerSrc = (plannerSample ? sample.planner : real.planner) as PlannerSummary;
  const weeklySrc: DashInput = all ? sample : { ...real, tasks: doneSample ? sample.tasks : real.tasks };

  const backlog = backlogKpi(tasksSrc, period);
  const done = doneKpi(doneSrc, period);
  const plan = plannerKpi(plannerSrc);
  const thesis = thesisKpi({ ...logsSrc, thesisDeadline: real.thesisDeadline }, period);
  const weekly = weeklyRhythm(weeklySrc);
  const daily = dailyRhythm(logsSrc, period);
  // Thói quen thật lấy cả danh sách Habits lẫn Daily Log thật; chưa kết nối Habits → mẫu
  const habitStats = habitKpis(habitsSample ? sample : real, period);
  // Danh sách Planner: chế độ Thật mà chưa có dự án → báo trống (SPEC-v0.3 4.5), không dùng mẫu
  const lanes = all ? plannerLanes(sample.planner as PlannerSummary) : real.planner ? plannerLanes(real.planner) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Kỳ"
          value={period}
          options={PERIODS.map((p) => ({ value: p, label: `${p} ngày` }))}
          onChange={(p) => {
            setPeriod(p);
            store(PERIOD_KEY, String(p));
          }}
        />
        <Segmented
          label="Dữ liệu"
          className="ml-auto"
          value={mode}
          options={[
            { value: "real" as Mode, label: "Thật" },
            { value: "sample" as Mode, label: "Mẫu" },
          ]}
          onChange={(m) => {
            setMode(m);
            store(MODE_KEY, m);
          }}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Việc tồn"
          subtitle="Notion Tasks"
          tone={backlog.tone}
          value={fmt.format(backlog.value)}
          series={backlog.series}
          change={backlog.change}
          upIsGood={false}
          note={backlog.overdue > 0 ? `${backlog.overdue} quá hạn` : "không có quá hạn"}
          sample={all}
        />
        <KpiCard
          title="Hoàn thành"
          subtitle={`Task xong · ${period} ngày`}
          tone={done.tone}
          value={fmt.format(done.value)}
          series={done.series}
          change={done.change}
          note={`TB ${fmt.format(done.perDay)}/ngày`}
          sample={doneSample}
        />
        <KpiCard
          title="Planner"
          subtitle="Tuần này"
          tone={plan.tone}
          value={`${plan.value}%`}
          series={plan.series}
          change={plan.change}
          changeUnit="điểm"
          note={`${plan.tally.done}/${plan.tally.total} slot`}
          sample={plannerSample}
        />
        <KpiCard
          title="Đồ án"
          subtitle={real.thesisDeadline ? `Còn đến hạn ${formatDay(real.thesisDeadline, true)}` : "Chưa đặt THESIS_DEADLINE"}
          tone={thesis.tone}
          value={thesis.left === null ? "—" : thesis.left > 0 ? `${thesis.left} ngày` : thesis.left === 0 ? "Hôm nay" : "Đã qua hạn"}
          series={thesis.series}
          note={`Ghi log ${thesis.logged}/${period} ngày`}
          sample={logsSample}
        />
      </div>

      {/* Bố cục (Trung chốt 26/10/2026): số liệu → việc cần làm → học được gì → nhịp hằng ngày */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Task theo dự án" className="lg:col-span-2" action={all && <SampleBadge />}>
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">Việc chưa xong · bấm cột để mở Tasks</p>
          <ProjectBars rows={tasksByProject(tasksSrc.tasks)} />
        </Card>
        {/* Cột phải: hai khối "việc cần làm" xếp chồng (SPEC-v0.4 mục 7) */}
        <div className="flex flex-col gap-5">
          <Card
            title="Mục tiêu tháng này"
            action={
              <span className="flex items-center gap-2">
                {goalsSample && <SampleBadge />}
                <Link href="/goals?level=month" className="text-sm text-muted-foreground hover:text-foreground">
                  Mở
                </Link>
              </span>
            }
          >
            <MonthGoals goals={goalsSample ? sample.monthGoals : real.monthGoals} />
          </Card>
          <Card title="Dự án Planner" action={all && <SampleBadge />}>
            <p className="-mt-3 mb-4 text-sm text-muted-foreground">Tuần này · chậm nhất ở trên</p>
            {lanes && lanes.lanes.length > 0 ? (
              <PlannerLanes lanes={lanes.lanes} more={lanes.more} />
            ) : (
              <Empty>
                Chưa có dự án Planner tuần này.{" "}
                <a href="/planner" className="text-primary underline underline-offset-2">
                  Mở Planner
                </a>
              </Empty>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Nhịp làm & học"
          action={
            <span className="flex items-center gap-2">
              {doneSample && <SampleBadge />}
              <ChangeBadge change={weekly.change} />
            </span>
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">12 tuần · task xong và kiến thức mới · tuần cuối đang diễn ra</p>
          <WeeklyArea rows={weekly.rows} />
        </Card>
        {/* Brain nhúng vào Dashboard, nửa hàng, cao bằng biểu đồ bên cạnh; luôn là dữ liệu thật */}
        <Card
          title="Brain"
          action={
            <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <Maximize2Icon aria-hidden="true" className="size-3.5" />
              Mở toàn màn hình
            </Link>
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">Bản đồ kiến thức và dự án · luôn là dữ liệu thật</p>
          <BrainView data={graph} className="h-73 rounded-xl" />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card
          title="Nhịp hằng ngày"
          className="lg:col-span-2"
          action={
            <span className="flex flex-wrap justify-end gap-1.5">
              {logsSample && <SampleBadge />}
              <Badge variant="outline" radius="full">{daily.logged} ngày có log</Badge>
              <Badge variant="success-light" radius="full">{daily.exercised} ngày tập</Badge>
              <Badge variant="warning-light" radius="full">{daily.dropped} ngày rơi việc</Badge>
            </span>
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">Daily Log · số việc xong mỗi ngày</p>
          <DailyBars days={daily.days} />
        </Card>
        <Card
          title="Thói quen"
          action={
            <span className="flex items-center gap-1.5">
              {habitsSample && <SampleBadge />}
              {habitStats.average !== null && (
                <Badge variant="outline" radius="full">
                  TB {habitStats.average}%
                </Badge>
              )}
            </span>
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">
            {period} ngày ·{" "}
            <Link href="/goals" className="underline underline-offset-2 hover:text-foreground">
              xem bảng tháng
            </Link>
          </p>
          {habitStats.rows.length > 0 ? (
            <HabitBars rows={habitStats.rows} />
          ) : (
            <Empty>Chưa có thói quen nào được theo dõi trong kỳ này.</Empty>
          )}
        </Card>
      </div>
    </div>
  );
}

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null;
  return (
    <Badge variant={change >= 0 ? "success-light" : "destructive-light"} radius="full">
      {change > 0 ? "+" : ""}
      {change}%
    </Badge>
  );
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex rounded-full border border-line bg-surface p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              o.value === value ? "bg-accent-soft font-medium text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
