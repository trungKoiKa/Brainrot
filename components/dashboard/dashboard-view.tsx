"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Card } from "@/components/card";
import { Badge } from "@/components/reui/badge";
import { formatDay } from "@/lib/date";
import { goalCounts } from "@/lib/goals";
import { sampleDashboard } from "@/lib/dashboard/sample";
import { backlogKpi, dailyRhythm, doneKpi, habitKpis, PERIODS, dueSoon, tasksByProject, thesisKpi, weeklyRhythm, weekSummary, type DashInput, type Period, weekKpi } from "@/lib/dashboard/stats";
import { ChangeBadge, DailyBars, DueSoonList, HabitBars, KpiStrip, MIN_ACTIVE_WEEKS, MonthGoals, ProjectBars, ToneDot, WeeklyArea } from "./dashboard-blocks";
import { readChoice, writeChoice } from "@/lib/local-store";
import { Segmented } from "./segmented";

type Mode = "real" | "sample";

const MODE_KEY = "dashboard.mode";

const PERIOD_KEY = "dashboard.period";

const fmt = new Intl.NumberFormat("vi-VN");

const linkClass = "font-medium text-primary underline-offset-4 hover:underline";

// Khung trong lưới cao bằng hàng
const fill = "h-full";

const SPAN = { 1: "", 2: "lg:col-span-2", 3: "lg:col-span-3" } as const;

/** Một khối có dữ liệu (vẽ trong lưới) hoặc không (một dòng trong khung "Chưa có dữ liệu"). */
type Block = { key: string; span: 1 | 2 | 3; full: boolean; title: string; node: React.ReactNode; empty: React.ReactNode };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function DashboardView({ real }: { real: DashInput }) {
  const [mode, setModeState] = useState<Mode>(() => readChoice<Mode>(MODE_KEY, ["real", "sample"], "real"));
  const [period, setPeriod] = useState<Period>(() => readChoice<Period>(PERIOD_KEY, PERIODS, 30));
  const sample = useMemo(
    () => sampleDashboard(real.today, real.thesisDeadline ?? undefined),
    [real.today, real.thesisDeadline],
  );
  const setMode = (m: Mode) => {
    setModeState(m);
    writeChoice(MODE_KEY, m);
  };

  // "Thật là thật" (Trung chốt 07/11/2026, thay SPEC.md mục 5.4): chế độ Thật không bao giờ lấp bằng mẫu;
  // khối thiếu dữ liệu nói rõ và chỉ chỗ thêm. Dữ liệu mẫu chỉ hiện khi bật "Mẫu".
  const all = mode === "sample";
  const src: DashInput = all ? { ...sample, thesisDeadline: real.thesisDeadline, thesisLabel: real.thesisLabel } : real;

  const summary = weekSummary(src);
  const backlog = backlogKpi(src, period);
  const done = doneKpi(src, period);
  const week = weekKpi(src);
  const thesis = thesisKpi(src, period);
  const weekly = weeklyRhythm(src);
  const daily = dailyRhythm(src, period);
  const habitStats = habitKpis(src, period);
  const due = dueSoon(src);
  const projects = tasksByProject(src.tasks, src.projects);
  // Biểu đồ Nhịp hằng ngày cần ít nhất ngần này ngày có log (7 ngày → 3, 30/90 ngày → 5)
  const minLoggedDays = Math.min(5, Math.ceil(period / 3));
  const weeklyDone = weekly.rows.reduce((s, r) => s + r.done, 0);
  const weeklyLearned = weekly.rows.reduce((s, r) => s + r.learned, 0);
  const weeklyActive = weekly.rows.filter((r) => r.done + r.learned > 0).length;

  // Thứ tự để lưới dày không hở: dự án (2) + mục tiêu · nhịp làm (2) + sắp đến hạn · nhịp hằng ngày (2) + thói quen
  const blocks: Block[] = [
    {
      key: "projects",
      span: 2,
      full: projects.length > 0,
      title: "Việc theo dự án",
      node: (
        <Card title="Việc theo dự án" className={fill}>
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">Việc chưa xong · bấm cột hoặc tên dự án để mở Tasks</p>
          <ProjectBars rows={projects} />
        </Card>
      ),
      empty: (
        <>
          Không còn việc nào chưa xong.{" "}
          <Link href="/tasks" className={linkClass}>
            Thêm việc ở Tasks
          </Link>
        </>
      ),
    },
    {
      key: "goals",
      span: 1,
      full: goalCounts(src.monthGoals).total > 0,
      title: "Mục tiêu tháng này",
      node: (
        <Card
          title="Mục tiêu tháng này"
          className={fill}
          action={
            <Link href="/goals?level=month" className="text-sm text-muted-foreground hover:text-foreground">
              Mở Goal
            </Link>
          }
        >
          <MonthGoals goals={src.monthGoals} />
        </Card>
      ),
      empty: (
        <>
          Chưa đặt mục tiêu tháng này.{" "}
          <Link href="/goals?level=month" className={linkClass}>
            Đặt mục tiêu ở Goal
          </Link>
        </>
      ),
    },
    {
      key: "weekly",
      span: 2,
      full: weeklyActive >= MIN_ACTIVE_WEEKS,
      title: "Nhịp làm & học",
      node: (
        <Card title="Nhịp làm & học" className={fill} action={<ChangeBadge change={weekly.change} />}>
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">12 tuần · việc xong và ghi chú mới mỗi tuần · tuần cuối đang diễn ra</p>
          <WeeklyArea rows={weekly.rows} />
        </Card>
      ),
      empty:
        weeklyDone + weeklyLearned === 0
          ? "Chưa có việc nào xong hay ghi chú nào trong 12 tuần qua."
          : `12 tuần qua: ${weeklyDone} việc xong, ${weeklyLearned} ghi chú mới, ${weeklyActive} tuần có hoạt động. Biểu đồ hiện khi có từ ${MIN_ACTIVE_WEEKS} tuần.`,
    },
    {
      key: "due",
      span: 1,
      full: due.items.length > 0,
      title: "Sắp đến hạn",
      node: (
        <Card
          title="Sắp đến hạn"
          className={fill}
          action={
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
              Mở Tasks
            </Link>
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">Chưa xong · quá hạn hoặc hạn ≤ 14 ngày</p>
          <DueSoonList items={due.items} more={due.more} />
        </Card>
      ),
      empty: "Không có việc nào quá hạn hay sắp đến hạn.",
    },
    {
      key: "daily",
      span: 2,
      full: daily.logged >= minLoggedDays,
      title: "Nhịp hằng ngày",
      node: (
        <Card
          title="Nhịp hằng ngày"
          className={fill}
          action={
            <span className="flex flex-wrap justify-end gap-1.5">
              <Badge variant="outline" radius="full">{daily.logged} ngày có log</Badge>
              {/* Số 0 không mang màu "tốt"/"cảnh báo" */}
              <Badge variant={daily.exercised > 0 ? "success-light" : "outline"} radius="full">{daily.exercised} ngày tập</Badge>
              <Badge variant={daily.dropped > 0 ? "warning-light" : "outline"} radius="full">{daily.dropped} ngày có việc chưa xong</Badge>
            </span>
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">Daily Log · số việc xong mỗi ngày</p>
          <DailyBars days={daily.days} />
        </Card>
      ),
      empty: (
        <>
          {daily.logged === 0
            ? `Chưa ghi Daily Log nào trong ${period} ngày qua.`
            : `Mới ghi log ${daily.logged}/${period} ngày; biểu đồ hiện khi có từ ${minLoggedDays} ngày.`}{" "}
          <Link href="/today" className={linkClass}>
            Ghi ở cụm Cuối ngày trên Today
          </Link>
        </>
      ),
    },
    {
      key: "habits",
      span: 1,
      full: habitStats.rows.length > 0,
      title: "Thói quen",
      node: (
        <Card
          title="Thói quen"
          className={fill}
          action={
            habitStats.average !== null && (
              <Badge variant="outline" radius="full">
                TB {habitStats.average}%
              </Badge>
            )
          }
        >
          <p className="-mt-3 mb-4 text-sm text-muted-foreground">
            {period} ngày ·{" "}
            <Link href="/goals?level=month" className="underline underline-offset-2 hover:text-foreground">
              xem bảng tháng
            </Link>
          </p>
          <HabitBars rows={habitStats.rows} />
        </Card>
      ),
      empty: (
        <>
          Chưa có thói quen nào trong kỳ này.{" "}
          <Link href="/goals?level=month" className={linkClass}>
            Thêm ở Goal
          </Link>
        </>
      ),
    },
  ];
  const shown = blocks.filter((b) => b.full);
  const missing = blocks.filter((b) => !b.full);
  // Hàng cuối chưa đủ 3 cột → khối cuối giãn ra cho kín hàng
  const cells = shown.reduce((s, b) => s + b.span, 0);
  const spans = shown.map((b, i) => (i === shown.length - 1 && cells % 3 ? Math.min(3, b.span + 3 - (cells % 3)) : b.span) as 1 | 2 | 3);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Kỳ"
          value={period}
          options={PERIODS.map((p) => ({ value: p, label: `${p} ngày` }))}
          onChange={(p) => {
            setPeriod(p);
            writeChoice(PERIOD_KEY, p);
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
          onChange={setMode}
        />
      </div>

      {/* Một dải thông báo thay cho nhãn "Mẫu" trên từng khung (critique lần 3) */}
      {all && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm">
          <span>
            Đang xem <span className="font-medium">dữ liệu mẫu</span>, không phải số của bạn.
          </span>
          <button type="button" onClick={() => setMode("real")} className={`ml-auto ${linkClass}`}>
            Về dữ liệu thật
          </button>
        </div>
      )}

      {/* Câu kết luận là chữ to nhất thẻ; nhãn "Tuần này" chỉ là nhãn nhỏ (SPEC.md mục 5.4, critique lần 2–3) */}
      <Card>
        <h2 className="text-sm font-medium text-muted-foreground">Tuần này · từ {formatDay(summary.monday, true)}</h2>
        <p className="mt-3 flex items-start gap-3 text-2xl leading-snug font-semibold text-pretty md:text-3xl">
          {summary.tone !== "none" && (
            <span className="mt-[0.55em] flex shrink-0">
              <ToneDot tone={summary.tone} />
            </span>
          )}
          {summary.headline}
        </p>
        {summary.facts.length > 0 && <p className="mt-3 text-sm text-muted-foreground tabular-nums">{summary.facts.join(" · ")}</p>}
        {summary.action ? (
          <Link href={summary.action.href} className={`mt-4 inline-flex items-center gap-1.5 text-sm ${linkClass}`}>
            {summary.action.label}
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
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
            note: done.value === 0 ? "chưa có việc xong" : done.perDay < 0.1 ? "TB dưới 0,1/ngày" : `TB ${fmt.format(done.perDay)}/ngày`,
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
            title: capitalize(real.thesisLabel ?? "hạn chót"),
            tone: thesis.tone,
            value: thesis.left === null ? "—" : thesis.left > 0 ? String(thesis.left) : thesis.left === 0 ? "Hôm nay" : "Đã qua hạn",
            unit: thesis.left !== null && thesis.left > 0 ? "ngày" : undefined,
            // Không vẽ sparkline: số ngày còn lại không có chuỗi theo thời gian để so
            series: [],
            note: real.thesisDeadline ? `hạn ${formatDay(real.thesisDeadline, true)}` : "chưa đặt hạn",
          },
        ]}
      />

      {shown.length > 0 && (
        <div className="grid gap-5 lg:grid-flow-row-dense lg:grid-cols-3">
          {shown.map((b, i) => (
            <div key={b.key} className={`min-w-0 ${SPAN[spans[i]]}`}>
              {b.node}
            </div>
          ))}
        </div>
      )}

      {/* Khối chưa có dữ liệu: gom về một khung cuối trang, mỗi khối một dòng (critique lần 3) */}
      {missing.length > 0 && (
        <Card title="Chưa có dữ liệu">
          <ul className="divide-y divide-line-soft text-sm">
            {missing.map((b) => (
              <li key={b.key} className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <span className="font-medium">{b.title}</span>
                <span className="text-pretty text-muted-foreground">{b.empty}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
