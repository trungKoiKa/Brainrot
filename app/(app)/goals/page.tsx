import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { GoalPanel } from "@/components/goals/goal-panel";
import { PeriodBars, type PeriodBar } from "@/components/goals/period-bars";
import { ProgressRing } from "@/components/goals/progress-ring";
import { HabitMonth } from "@/components/habits/habit-month";
import { PageHeader } from "@/components/page-header";
import { StaleBanner } from "@/components/stale-banner";
import { todayVN } from "@/lib/date";
import { goalCounts, goalsOf, type Goal } from "@/lib/goals";
import { doneHabits } from "@/lib/habits";
import { anyStale, getDailyLogsBetween, getGoals, getHabits } from "@/lib/notion/data";
import { resolveGoals } from "@/lib/notion/goal-status";
import { goalsConfigured, habitsConfigured } from "@/lib/notion/queries";
import {
  childPeriods,
  LEVEL_LABEL,
  LEVELS,
  monthOf,
  parsePeriod,
  periodLabel,
  periodOf,
  shiftPeriod,
  shortLabel,
  type Level,
  type Period,
} from "@/lib/period";

// SPEC-v0.4 mục 6. Bước 3: 4 chế độ + mục tiêu; Nhìn lại (bước 5) và thẻ 7 ngày (bước 6) làm sau.
const href = (p: Period) => `/goals?level=${p.level}&period=${p.key}`;

export default function GoalsPage({ searchParams }: PageProps<"/goals">) {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Mục tiêu" subtitle="Mục tiêu, thói quen và nhìn lại theo năm · quý · tháng · tuần." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <GoalsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GoalsContent({ searchParams }: Pick<PageProps<"/goals">, "searchParams">) {
  await connection(); // kỳ hiện tại, ô tích được phụ thuộc ngày hôm nay
  const today = todayVN();
  const params = await searchParams;
  const level: Level = LEVELS.includes(params.level as Level) ? (params.level as Level) : "month";
  const period = (typeof params.period === "string" && parsePeriod(level, params.period)) || periodOf(level, today);
  const current = periodOf(level, today);

  const children = childPeriods(period);
  const [goalsLoaded, habits, logs] = await Promise.all([
    getGoals(),
    getHabits(),
    level === "month" ? getDailyLogsBetween(period.start, period.end) : null,
  ]);
  // Trạng thái tự xong cho mục tiêu của kỳ đang xem + các kỳ con (cột %, thẻ quý/tháng)
  const shown = [period, ...children];
  const resolved = await resolveGoals(goalsLoaded.data.filter((g) => shown.some((p) => p.level === g.level && p.start === g.start)));
  const goals = resolved.goals;
  // Thói quen gắn được: được theo dõi ở ít nhất một tháng của kỳ
  const linkable = habits.data.filter(
    (h) => monthOf(h.from) <= monthOf(period.end) && (h.to === null || monthOf(h.to) >= monthOf(period.start)),
  );
  const panelGoals = goalsOf(goals, period);
  // key đổi khi dữ liệu server đổi (vd. vừa gắn thói quen) → khối mục tiêu nạp lại trạng thái mới
  const panelKey = `${href(period)}|${panelGoals.map((g) => `${g.id}:${g.done}:${g.autoDone}:${g.habitId}:${g.threshold}`).join(",")}`;
  const bars = (list: Period[]): PeriodBar[] =>
    list.map((p) => {
      const c = goalCounts(goalsOf(goals, p));
      return { href: href(p), label: shortLabel(p), pct: c.progress, total: c.total, current: p.start <= today && today <= p.end };
    });

  return (
    <div className="space-y-5">
      <StaleBanner show={anyStale(goalsLoaded, habits, ...resolved.loaded, ...(logs ? [logs] : []))} />

      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Cấp" className="flex rounded-full border border-line bg-surface p-0.5">
          {LEVELS.map((l) => (
            <Link
              key={l}
              // đổi cấp giữ ngữ cảnh: đang xem tháng 10 → bấm Năm ra năm 2026
              href={href(periodOf(l, period.start <= today && today <= period.end ? today : period.start))}
              aria-current={l === level ? "page" : undefined}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                l === level ? "bg-accent-soft font-medium text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {LEVEL_LABEL[l]}
            </Link>
          ))}
        </nav>
        <nav aria-label="Đổi kỳ" className="ml-auto flex items-center gap-1">
          <Link href={href(shiftPeriod(period, -1))} aria-label="Kỳ trước" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <ChevronLeftIcon className="size-4" />
          </Link>
          <span className="min-w-40 text-center font-serif text-lg font-semibold">{periodLabel(period)}</span>
          <Link href={href(shiftPeriod(period, 1))} aria-label="Kỳ sau" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <ChevronRightIcon className="size-4" />
          </Link>
          {period.key !== current.key && (
            <Link href={href(current)} className="ml-2 rounded-full border border-line px-3 py-1 text-sm hover:border-primary">
              Hôm nay
            </Link>
          )}
        </nav>
      </div>

      {goalsConfigured() ? (
        <div className={`grid gap-5 ${children.length ? "lg:grid-cols-5" : ""}`}>
          <Card title={`Mục tiêu ${LEVEL_LABEL[level].toLowerCase()}`} className={children.length ? "lg:col-span-3" : ""}>
            {/* key theo kỳ → đổi kỳ thì danh sách nạp lại từ server */}
            <GoalPanel
              key={panelKey}
              level={level}
              periodKey={period.key}
              initial={panelGoals}
              habits={linkable.map((h) => ({ id: h.id, name: h.name }))}
            />
          </Card>
          {children.length > 0 && (
            <Card title={`Tiến độ các ${level === "month" ? "tuần" : "kỳ con"}`} className="lg:col-span-2">
              {level === "year" ? (
                <div className="space-y-6">
                  <PeriodBars bars={bars(children.filter((p) => p.level === "quarter"))} />
                  <PeriodBars bars={bars(children.filter((p) => p.level === "month"))} />
                </div>
              ) : (
                <PeriodBars bars={bars(children)} />
              )}
              <p className="mt-4 text-xs text-muted-foreground">% mục tiêu của từng kỳ · bấm cột để mở kỳ đó.</p>
            </Card>
          )}
        </div>
      ) : (
        <Card title="Mục tiêu">
          <Empty>Chưa kết nối database Goals — thêm biến môi trường NOTION_GOALS_DB.</Empty>
        </Card>
      )}

      {goalsConfigured() && (level === "year" || level === "quarter") && (
        <div className={`grid gap-5 sm:grid-cols-2 ${level === "year" ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
          {children
            .filter((p) => p.level === (level === "year" ? "quarter" : "month"))
            .map((p) => (
              <ChildCard key={p.key} period={p} goals={goalsOf(goals, p)} current={p.start <= today && today <= p.end} />
            ))}
        </div>
      )}

      {level === "month" &&
        (habitsConfigured() && logs ? (
          <HabitMonth
            key={period.key}
            month={period.key}
            today={today}
            habits={habits.data}
            doneByDay={Object.fromEntries(logs.data.flatMap((l) => (l.date ? [[l.date, doneHabits(l)]] : [])))}
          />
        ) : (
          <Card title="Thói quen">
            <Empty>Chưa kết nối database Habits — thêm biến môi trường NOTION_HABITS_DB.</Empty>
          </Card>
        ))}
    </div>
  );
}

/** Thẻ quý (trong Năm) / tháng (trong Quý): % + mục tiêu Ưu tiên, bấm để mở (SPEC-v0.4 6.3). */
function ChildCard({ period, goals, current }: { period: Period; goals: Goal[]; current: boolean }) {
  const c = goalCounts(goals);
  const priority = goals.filter((g) => g.type === "Ưu tiên" && g.title.trim());
  return (
    // Viền nổi bật đặt ở ring của link (Card đã có border-line, thêm border-* nữa thì không chắc class nào thắng)
    <Link
      href={href(period)}
      className={`block rounded-2xl ring-primary transition-shadow hover:ring-1 focus-visible:outline-2 focus-visible:outline-primary ${current ? "ring-1" : ""}`}
    >
      <Card className="h-full">
        <div className="flex items-center gap-4">
          <ProgressRing pct={c.progress} size={64} empty={c.total === 0} />
          <div>
            <h2 className="font-serif text-lg font-semibold">{periodLabel(period)}</h2>
            <p className="text-xs text-muted-foreground">
              {c.completed}/{c.total} mục tiêu
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm">
          {priority.length === 0 ? (
            <li className="text-muted-foreground">Chưa có mục tiêu ưu tiên.</li>
          ) : (
            priority.map((g) => (
              <li key={g.id} className={`truncate ${g.done ? "text-muted-foreground line-through" : ""}`}>
                {g.title}
              </li>
            ))
          )}
        </ul>
      </Card>
    </Link>
  );
}
