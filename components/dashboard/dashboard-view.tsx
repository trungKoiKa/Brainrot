"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/card";
import { Badge } from "@/components/reui/badge";
import { formatDay } from "@/lib/date";
import { sampleDashboard } from "@/lib/dashboard/sample";
import {
  backlogKpi,
  dailyRhythm,
  doneKpi,
  habitKpis,
  PERIODS,
  dueSoon,
  tasksByProject,
  thesisKpi,
  weeklyRhythm,
  weekSummary,
  type DashInput,
  type Period,
  weekKpi,
} from "@/lib/dashboard/stats";
import { DailyBars, DueSoonList, HabitBars, KpiStrip, MonthGoals, ProjectBars, SampleBadge, ToneDot, WeeklyArea } from "./dashboard-blocks";

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

const fmt = new Intl.NumberFormat("vi-VN");
const linkClass = "font-medium text-primary underline-offset-4 hover:underline";

export function DashboardView({ real }: { real: DashInput }) {
  const [mode, setMode] = useState<Mode>(() => readStored<Mode>(MODE_KEY, ["real", "sample"], "real"));
  const [period, setPeriod] = useState<Period>(() => readStored<Period>(PERIOD_KEY, PERIODS, 30));
  const sample = useMemo(
    () => sampleDashboard(real.today, real.thesisDeadline ?? undefined),
    [real.today, real.thesisDeadline],
  );

  // "Thật là thật" (Trung chốt 07/11/2026, thay SPEC-v0.3 mục 5): chế độ Thật không bao giờ lấp bằng mẫu;
  // khối thiếu dữ liệu nói rõ và chỉ chỗ thêm. Dữ liệu mẫu chỉ hiện khi bật "Mẫu".
  const all = mode === "sample";
  const src: DashInput = all ? { ...sample, thesisDeadline: real.thesisDeadline } : real;

  const summary = weekSummary(src);
  const backlog = backlogKpi(src, period);
  const done = doneKpi(src, period);
  const week = weekKpi(src);
  const thesis = thesisKpi(src, period);
  const weekly = weeklyRhythm(src);
  const daily = dailyRhythm(src, period);
  const habitStats = habitKpis(src, period);
  const due = dueSoon(src);

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

      {/* Tiêu điểm: một câu trả lời "tôi đang làm tốt không?" cho tuần này */}
      <Card
        title="Tuần này"
        focal
        action={
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {all && <SampleBadge />}
            từ {formatDay(summary.monday, true)}
          </span>
        }
      >
        <p className="flex items-center gap-2.5 text-lg font-medium text-pretty">
          {summary.tone !== "none" && <ToneDot tone={summary.tone} />}
          {summary.headline}
        </p>
        {summary.facts.length > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">{summary.facts.join(" · ")}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href="/today" className={linkClass}>
              Xếp việc ở Today
            </Link>{" "}
            hoặc{" "}
            <Link href="/goals?level=month" className={linkClass}>
              đặt mục tiêu tháng ở Goal
            </Link>
            .
          </p>
        )}
      </Card>

      <KpiStrip
        sample={all}
        items={[
          {
            title: "Việc tồn",
            tone: backlog.tone,
            value: fmt.format(backlog.value),
            series: backlog.series,
            change: backlog.change,
            upIsGood: false,
            note: backlog.overdue > 0 ? `${backlog.overdue} quá hạn` : "không có quá hạn",
          },
          {
            title: `Xong trong ${period} ngày`,
            tone: done.tone,
            value: fmt.format(done.value),
            series: done.series,
            change: done.change,
            note: done.value === 0 ? "chưa có việc xong" : `TB ${fmt.format(done.perDay)}/ngày`,
          },
          {
            title: "Việc theo lịch tuần này",
            tone: week.tone,
            value: week.value === null ? "—" : `${week.value}%`,
            series: week.series,
            change: week.change,
            changeUnit: "điểm",
            note: week.tally.total === 0 ? "chưa xếp lịch việc nào" : `${week.tally.done}/${week.tally.total} việc`,
          },
          {
            title: "Đồ án",
            tone: thesis.tone,
            value: thesis.left === null ? "—" : thesis.left > 0 ? `${thesis.left} ngày` : thesis.left === 0 ? "Hôm nay" : "Đã qua hạn",
            series: thesis.series,
            note: real.thesisDeadline
              ? `hạn ${formatDay(real.thesisDeadline, true)} · ghi log ${thesis.logged}/${period} ngày`
              : "chưa đặt hạn",
          },
        ]}
      />

      {/* Bố cục: tóm tắt → số liệu → việc cần làm → nhịp làm + thói quen → nhịp hằng ngày */}
      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <Card title="Task theo dự án" className="lg:col-span-2" action={all && <SampleBadge />}>
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">Việc chưa xong · bấm cột để mở Tasks</p>
          <ProjectBars rows={tasksByProject(src.tasks)} />
        </Card>
        {/* Cột phải: hai khối "việc cần làm" xếp chồng (SPEC-v0.4 mục 7, SPEC-v0.5 4.4) */}
        <div className="flex flex-col gap-5">
          <Card
            title="Mục tiêu tháng này"
            action={
              <span className="flex items-center gap-2">
                {all && <SampleBadge />}
                <Link href="/goals?level=month" className="text-sm text-muted-foreground hover:text-foreground">
                  Mở Goal
                </Link>
              </span>
            }
          >
            <MonthGoals goals={src.monthGoals} />
          </Card>
          <Card
            title="Sắp đến hạn"
            action={
              <span className="flex items-center gap-2">
                {all && <SampleBadge />}
                <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
                  Mở Tasks
                </Link>
              </span>
            }
          >
            <p className="-mt-3 mb-4 text-sm text-muted-foreground">Việc chưa xong · quá hạn hoặc hạn trong 14 ngày</p>
            <DueSoonList items={due.items} more={due.more} />
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <Card
          title="Nhịp làm"
          className="lg:col-span-2"
          action={
            <span className="flex items-center gap-2">
              {all && <SampleBadge />}
              <ChangeBadge change={weekly.change} />
            </span>
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">12 tuần · việc xong mỗi tuần · tuần cuối đang diễn ra</p>
          <WeeklyArea rows={weekly.rows} />
        </Card>
        <Card
          title="Thói quen"
          action={
            <span className="flex items-center gap-1.5">
              {all && <SampleBadge />}
              {habitStats.average !== null && (
                <Badge variant="outline" radius="full">
                  TB {habitStats.average}%
                </Badge>
              )}
            </span>
          }
        >
          {habitStats.rows.length > 0 ? (
            <>
              <p className="-mt-3 mb-4 text-sm text-muted-foreground">
                {period} ngày ·{" "}
                <Link href="/goals" className="underline underline-offset-2 hover:text-foreground">
                  xem bảng tháng
                </Link>
              </p>
              <HabitBars rows={habitStats.rows} />
            </>
          ) : (
            <p className="text-sm text-pretty text-muted-foreground">
              Chưa có thói quen nào trong kỳ này.{" "}
              <Link href="/goals" className={linkClass}>
                Thêm ở Goal
              </Link>
            </p>
          )}
        </Card>
      </div>

      <Card
        title="Nhịp hằng ngày"
        action={
          daily.logged > 0 && (
            <span className="flex flex-wrap justify-end gap-1.5">
              {all && <SampleBadge />}
              <Badge variant="outline" radius="full">{daily.logged} ngày có log</Badge>
              <Badge variant="success-light" radius="full">{daily.exercised} ngày tập</Badge>
              <Badge variant="warning-light" radius="full">{daily.dropped} ngày rơi việc</Badge>
            </span>
          )
        }
      >
        {daily.logged > 0 ? (
          <>
            <p className="-mt-3 mb-4 text-sm text-muted-foreground">Daily Log · số việc xong mỗi ngày</p>
            <DailyBars days={daily.days} />
          </>
        ) : (
          <p className="text-sm text-pretty text-muted-foreground">
            Chưa ghi Daily Log nào trong {period} ngày qua.{" "}
            <Link href="/today" className={linkClass}>
              Ghi ở cụm Cuối ngày trên Today
            </Link>
          </p>
        )}
      </Card>
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
