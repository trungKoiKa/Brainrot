// SPEC.md mục 5.3. Bước 3: 4 chế độ + mục tiêu; Nhìn lại ở mọi chế độ; thẻ 7 ngày ở chế độ Tuần.

import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Card } from "@/components/card";
import { GoalPanel } from "@/components/goals/goal-panel";
import { PrevFocus } from "@/components/goals/prev-focus";
import { ReflectionForm } from "@/components/goals/reflection-form";
import { PeriodBars, type PeriodBar } from "@/components/goals/period-bars";
import { WeekCards } from "@/components/goals/week-cards";
import { HabitGrid } from "@/components/habits/habit-grid";
import { HabitMonth } from "@/components/habits/habit-month";
import { HabitWeek } from "@/components/habits/habit-week";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, todayVN } from "@/lib/date";
import { goalCounts, goalsOf, isGoalDone } from "@/lib/goals";
import { doneHabits } from "@/lib/habits";
import { getDailyLogsBetween, getGoals, getHabits, getReflections, getTasks } from "@/lib/db/data";
import { resolveGoals } from "@/lib/db/goal-status";
import { previousFocus, reflectionOf } from "@/lib/reflections";
import { childPeriods, goalsHref, LEVEL_LABEL, LEVELS, monthOf, parsePeriod, periodLabel, periodOf, shiftPeriod, shortLabel, type Level, type Period } from "@/lib/period";
import { ChildCard } from "../../../components/goals/child-card";

export default function GoalsPage({ searchParams }: PageProps<"/goals">) {
  return (
    <div>
      <PageHeader kicker="MỤC TIÊU" title="Goal" subtitle="Mục tiêu, thói quen và nhìn lại theo năm · quý · tháng · tuần." />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <GoalsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GoalsContent({ searchParams }: Pick<PageProps<"/goals">, "searchParams">) {
  await connection(); // kỳ hiện tại, ô tích được phụ thuộc ngày hôm nay
  const today = todayVN();
  const params = await searchParams;
  const level: Level = LEVELS.includes(params.level as Level) ? (params.level as Level) : "week"; // mặc định Tuần (Trung chốt 19/11/2026)
  const period = (typeof params.period === "string" && parsePeriod(level, params.period)) || periodOf(level, today);
  const current = periodOf(level, today);

  const children = childPeriods(period);
  // Một lần đọc Daily Log phủ cả kỳ đang xem lẫn các kỳ con (tuần lấn sang tháng bên cạnh) → resolveGoals dùng lại (rà soát A4)
  const logFrom = [period, ...children].reduce((m, p) => (p.start < m ? p.start : m), period.start);
  const logTo = [period, ...children].reduce((m, p) => (p.end > m ? p.end : m), period.end);
  const [allGoals, habits, reflections, allLogs, weekTasks] = await Promise.all([
    getGoals(),
    getHabits(),
    getReflections(),
    getDailyLogsBetween(logFrom, logTo), // mọi cấp: thói quen của kỳ cần Daily Log
    getTasks(), // việc gắn dưới mỗi mục tiêu (mọi cấp) + thẻ ngày / khay ở Tuần
  ]);
  const inRange = (from: string, to: string) => allLogs.filter((l) => l.date && from <= l.date && l.date <= to);
  // Tháng / Tuần: Daily Log cho mục tiêu tự xong và thẻ 7 ngày (như trước); Năm / Quý không dùng
  const logs = level === "month" || level === "week" ? inRange(logFrom, logTo) : null;
  // Thói quen của đúng kỳ đang xem (Trung chốt 19/11/2026): Tuần 7 ngày, Tháng cả tháng, Quý / Năm lưới chỉ xem
  const habitDone = Object.fromEntries(
    inRange(period.start, period.end).flatMap((l) => (l.date ? [[l.date, doneHabits(l)]] : [])),
  );
  const isCurrent = period.start <= today && today <= period.end;
  const reflection = reflectionOf(reflections, period);
  const prevFocus = previousFocus(reflections, period);
  const motto = reflectionOf(reflections, periodOf("year", period.start))?.motto.trim() || null;
  // Trạng thái tự xong cho mục tiêu của kỳ đang xem + các kỳ con (cột %, thẻ quý/tháng)
  const shown = [period, ...children];
  const goals = await resolveGoals(
    allGoals.filter((g) => shown.some((p) => p.level === g.level && p.start === g.start)),
    logs ? { logs, from: logFrom, to: logTo } : undefined,
  );
  // Thói quen gắn được: được theo dõi ở ít nhất một tháng của kỳ
  const linkable = habits.filter(
    (h) => monthOf(h.from) <= monthOf(period.end) && (h.to === null || monthOf(h.to) >= monthOf(period.start)),
  );
  const panelGoals = goalsOf(goals, period);
  const panelKey = goalsHref(period); // chỉ đổi khi đổi kỳ; dữ liệu mới vào qua prop `initial` (giữ popover, focus, thông báo)
  const bars = (list: Period[]): PeriodBar[] =>
    list.map((p) => {
      const c = goalCounts(goalsOf(goals, p));
      return { href: goalsHref(p), label: shortLabel(p), pct: c.progress, total: c.total, current: p.start <= today && today <= p.end, ended: p.end < today };
    });

  // Chuỗi Mục tiêu → Việc → Ngày (SPEC.md mục 5.3)
  const taskById = new Map(weekTasks.map((t) => [t.id, t]));
  const linkedTasks = Object.fromEntries(
    panelGoals.map((g) => [
      g.id,
      g.taskIds.flatMap((id) => {
        const t = taskById.get(id);
        return t ? [{ id, title: t.title, plannedOn: t.plannedOn, done: t.status === "Xong" }] : [];
      }),
    ]),
  );
  const goalOfTask: Record<string, string> = {};
  for (const g of goals) for (const id of g.taskIds) goalOfTask[id] ??= g.title;
  const openTasks = weekTasks.filter((t) => t.status !== "Xong" && t.goalIds.length === 0).map((t) => ({ id: t.id, title: t.title }));
  const focusGoals = panelGoals.filter((g) => g.type === "Ưu tiên" && g.title.trim());
  const trayIds = [...new Set(panelGoals.flatMap((g) => g.taskIds))];
  const nextPeriod = shiftPeriod(period, 1);
  const hasUndone = panelGoals.some((g) => g.title.trim() && !isGoalDone(g));
  // Biểu đồ kỳ con chỉ hiện khi có từ hai kỳ con có mục tiêu (một cột giữa dãy vạch gạch ngang thì không so sánh được gì)
  const showBars = children.filter((p) => goalCounts(goalsOf(goals, p)).total > 0).length >= 2;
  const ended = period.end < today;
  // Thẻ kỳ con: quý (trong Năm) / tháng (trong Quý). Thẻ quý đếm thêm mục tiêu đặt ở các tháng của quý
  // (dòng phụ, không cộng vào % — Trung chốt 11/11/2026)
  const childCards = children
    .filter((p) => p.level === (level === "year" ? "quarter" : "month"))
    .map((p) => ({
      period: p,
      goals: goalsOf(goals, p),
      monthGoals: p.level === "quarter" ? childPeriods(p).reduce((n, m) => n + goalCounts(goalsOf(goals, m)).total, 0) : 0,
      current: p.start <= today && today <= p.end,
    }));

  return (
    <div className="space-y-5">
      {/* Châm ngôn năm (SPEC.md mục 5.3): hiện ở mọi chế độ của năm đó */}
      {motto && <p className="text-base text-muted-foreground italic">“{motto}”</p>}

      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Cấp" className="flex rounded-lg border border-line bg-surface p-0.5">
          {LEVELS.map((l) => (
            <Link
              key={l}
              // đổi cấp giữ ngữ cảnh: đang xem tháng 10 → bấm Năm ra năm 2026
              href={goalsHref(periodOf(l, period.start <= today && today <= period.end ? today : period.start))}
              aria-current={l === level ? "page" : undefined}
              className={`px-3 py-1 text-sm transition-colors ${
                l === level ? "bg-accent-soft font-medium text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {LEVEL_LABEL[l]}
            </Link>
          ))}
        </nav>
        <nav aria-label="Đổi kỳ" className="ml-auto flex items-center gap-1">
          <Link href={goalsHref(shiftPeriod(period, -1))} aria-label="Kỳ trước" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <ChevronLeftIcon className="size-4" />
          </Link>
          <span className="min-w-40 text-center text-base font-semibold tabular-nums">{periodLabel(period)}</span>
          <Link href={goalsHref(shiftPeriod(period, 1))} aria-label="Kỳ sau" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <ChevronRightIcon className="size-4" />
          </Link>
          {period.key !== current.key && (
            <Link href={goalsHref(current)} className="ml-2 rounded-full border border-line px-3 py-1 text-sm hover:border-primary">
              Kỳ này
            </Link>
          )}
        </nav>
      </div>

      {/* Thói quen là phần chính của Goal: luôn ở trên cùng, phạm vi đúng kỳ đang xem (Trung chốt 19/11/2026) */}
      {level === "week" ? (
        <HabitWeek
          key={period.key}
          title="Thói quen tuần"
          days={Array.from({ length: 7 }, (_, i) => addDays(period.start, i))}
          month={monthOf(isCurrent ? today : period.start)}
          today={today}
          habits={habits}
          doneByDay={habitDone}
        />
      ) : level === "month" ? (
        <HabitMonth key={period.key} month={period.key} today={today} habits={habits} doneByDay={habitDone} />
      ) : (
        <HabitGrid
          title={`Thói quen ${level === "year" ? "năm" : "quý"}`}
          start={period.start}
          end={period.end}
          today={today}
          habits={habits}
          doneByDay={habitDone}
          tickHref={goalsHref(periodOf("week", today))}
        />
      )}

      {/* Tuần: 7 ngày là việc của tuần, đứng trước danh sách mục tiêu */}
      {level === "week" && logs && weekTasks && (
        <Card title="7 ngày trong tuần">
          {focusGoals.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">Tập trung tuần này</span>
              {focusGoals.map((g) => {
                const list = linkedTasks[g.id] ?? [];
                return (
                  <a
                    key={g.id}
                    href={`#goal-${g.id}`}
                    className={`inline-flex max-w-full items-center gap-2 rounded-full border border-line px-3 py-1 outline-none hover:border-primary focus-visible:ring-3 focus-visible:ring-ring ${
                      isGoalDone(g) ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    <span className="min-w-0 truncate">{g.title}</span>
                    {list.length > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums no-underline">
                        {list.filter((t) => t.done).length}/{list.length} việc
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          )}
          <WeekCards key={period.key} weekStart={period.start} today={today} tasks={weekTasks} logs={logs} goalOfTask={goalOfTask} trayIds={trayIds} />
        </Card>
      )}

        <div className={`grid grid-cols-1 gap-5 ${showBars ? "lg:grid-cols-5 lg:items-start" : ""}`}>
          <Card focal title={`Mục tiêu ${LEVEL_LABEL[level].toLowerCase()}`} className={showBars ? "lg:col-span-3" : ""}>
            {prevFocus && (
              <PrevFocus
                key={period.key}
                text={prevFocus}
                level={level}
                periodKey={period.key}
                existing={panelGoals.map((g) => g.title)}
              />
            )}
            {/* key theo kỳ → đổi kỳ thì danh sách nạp lại từ server */}
            <GoalPanel
              key={panelKey}
              level={level}
              periodKey={period.key}
              initial={panelGoals}
              habits={linkable.map((h) => ({ id: h.id, name: h.name }))}
              ended={ended}
              linked={linkedTasks}
              openTasks={openTasks}
              next={hasUndone ? { label: periodLabel(nextPeriod) } : null}
            />
          </Card>
          {showBars && (
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

      {(level === "year" || level === "quarter") &&
        (childCards.every((c) => goalCounts(c.goals).total === 0 && c.monthGoals === 0) ? (
          // Mọi kỳ con còn trống: một dòng link thay cho 3–4 vòng "–" giống hệt nhau (rà soát 11/2026 P3)
          <Card>
            <p className="text-sm text-muted-foreground">
              Chưa {level === "year" ? "quý" : "tháng"} nào có mục tiêu. Mở một {level === "year" ? "quý" : "tháng"} để đặt:
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {childCards.map((c) => (
                <li key={c.period.key}>
                  <Link
                    href={goalsHref(c.period)}
                    aria-current={c.current ? "true" : undefined}
                    className={`inline-flex min-h-10 items-center border px-3 text-sm tabular-nums outline-none hover:border-primary focus-visible:ring-3 focus-visible:ring-ring md:min-h-8 ${c.current ? "border-primary text-primary" : "border-line"}`}
                  >
                    {periodLabel(c.period)}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <div className={`grid gap-5 sm:grid-cols-2 ${level === "year" ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
            {childCards.map((c) => (
              <ChildCard key={c.period.key} period={c.period} goals={c.goals} monthGoals={c.monthGoals} current={c.current} today={today} />
            ))}
          </div>
        ))}

      <Card title={`Nhìn lại ${LEVEL_LABEL[level].toLowerCase()}`}>
        {/* key theo kỳ + bản ghi → đổi kỳ / dữ liệu mới thì form nạp lại */}
        <ReflectionForm key={`${period.key}|${reflection?.id ?? "new"}`} level={level} periodKey={period.key} initial={reflection} />
      </Card>
    </div>
  );
}
