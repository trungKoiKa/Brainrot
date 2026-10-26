// Tính số liệu cho Dashboard (SPEC-v0.3 mục 4). Hàm thuần: ngày là chuỗi YYYY-MM-DD theo giờ VN.
import { addDays, daysBetween, mondayOf } from "@/lib/date";
import { isHabitActive, streaks } from "@/lib/habits";
import type { Goal } from "@/lib/goals";
import type { Habit, TaskStatus } from "@/lib/notion/types";
import { monthOf } from "@/lib/period";

export type Period = 7 | 30 | 90;
export const PERIODS: Period[] = [7, 30, 90];

export type DashTask = {
  title: string;
  /** Trang Notion (rỗng ở dữ liệu mẫu) */
  url: string;
  project: string | null;
  status: TaskStatus | null;
  deadline: string | null;
  doneOn: string | null;
  /** Ngày làm (SPEC-v0.5) */
  plannedOn: string | null;
  createdOn: string;
};

export type DashLog = {
  date: string;
  doneCount: number;
  exercised: boolean;
  dropped: boolean;
  /** Thói quen đã làm trong ngày (đã gộp checkbox "Tập thể dục" cũ) */
  habits: string[];
};

export type Tally = { done: number; total: number };

export type DashInput = {
  today: string;
  tasks: DashTask[];
  /** Ngày học của từng trang Knowledge */
  knowledge: string[];
  logs: DashLog[];
  thesisDeadline: string | null;
  /** Database Habits (SPEC-v0.4); rỗng khi chưa kết nối */
  habits: Habit[];
  /** Mục tiêu tháng này, đã gắn trạng thái tự xong (SPEC-v0.4 mục 7); rỗng khi chưa kết nối / chưa đặt */
  monthGoals: Goal[];
};

export type Tone = "good" | "warn" | "bad";

// Thứ tự như select "Dự án" trong Notion (giống trang Tasks)
export const PROJECT_ORDER = ["Đồ án", "Học AI", "Sản phẩm", "Sức khỏe", "Thực tập", "Khác"];
export const NO_PROJECT = "Không có dự án";

/** `n` ngày kết thúc ở `end`, cũ → mới. */
export function lastDays(end: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
}

export { mondayOf };

/** % thay đổi so với kỳ trước; kỳ trước = 0 → null (không so được). */
export function change(now: number, prev: number): number | null {
  return prev === 0 ? null : Math.round(((now - prev) / prev) * 100);
}

export const pct = ({ done, total }: Tally) => (total === 0 ? 0 : Math.round((done / total) * 100));

const isDone = (t: DashTask) => t.status === "Xong";

/** Task còn mở vào cuối ngày `day`. Task xong mà không có Ngày xong coi như đã đóng từ trước. */
export function openOn(tasks: DashTask[], day: string): number {
  return tasks.filter((t) => t.createdOn <= day && !(isDone(t) && (t.doneOn === null || t.doneOn <= day))).length;
}

export const hasDoneDates = (tasks: DashTask[]) => tasks.some((t) => t.doneOn !== null);

// ---------- 4.1 thẻ số liệu ----------

export type Kpi = {
  value: number;
  series: number[];
  change: number | null;
  tone: Tone;
};

export function backlogKpi({ today, tasks }: DashInput, period: Period) {
  const open = tasks.filter((t) => !isDone(t));
  const overdue = open.filter((t) => t.deadline !== null && t.deadline < today).length;
  const dueSoon = open.filter((t) => t.deadline !== null && t.deadline >= today && daysBetween(today, t.deadline) <= 3).length;
  const kpi: Kpi = {
    value: open.length,
    series: lastDays(today, period).map((d) => openOn(tasks, d)),
    change: change(open.length, openOn(tasks, addDays(today, -period))),
    tone: overdue > 0 ? "bad" : dueSoon > 0 ? "warn" : "good",
  };
  return { ...kpi, overdue };
}

export function doneKpi({ today, tasks }: DashInput, period: Period) {
  const countOn = (d: string) => tasks.filter((t) => isDone(t) && t.doneOn === d).length;
  const series = lastDays(today, period).map(countOn);
  const prev = lastDays(addDays(today, -period), period).reduce((s, d) => s + countOn(d), 0);
  const value = series.reduce((s, n) => s + n, 0);
  const kpi: Kpi = { value, series, change: change(value, prev), tone: value >= prev ? "good" : "warn" };
  return { ...kpi, perDay: Math.round((value / period) * 10) / 10 };
}

export const pctTone = (p: number): Tone => (p >= 70 ? "good" : p >= 40 ? "warn" : "bad");

/** "Tuần này" (SPEC-v0.5 4.4): % task có Ngày làm trong tuần đã xong; 12 tuần; so điểm % với tuần trước. */
export function weekKpi({ today, tasks }: DashInput) {
  const monday = mondayOf(today);
  const tallyOf = (start: string): Tally => {
    const end = addDays(start, 6);
    const planned = tasks.filter((t) => t.plannedOn !== null && t.plannedOn >= start && t.plannedOn <= end);
    return { done: planned.filter(isDone).length, total: planned.length };
  };
  const weeks = Array.from({ length: 12 }, (_, i) => tallyOf(addDays(monday, (i - 11) * 7)));
  const now = weeks[11];
  const last = weeks[10];
  const value = now.total === 0 ? null : pct(now);
  return {
    value,
    // tuần chưa xếp gì vẽ 0 cho liền nét
    series: weeks.map(pct),
    change: value === null || last.total === 0 ? null : value - pct(last),
    tone: value === null ? ("warn" as Tone) : pctTone(value),
    tally: now,
  };
}

export function thesisKpi({ today, logs, thesisDeadline }: DashInput, period: Period) {
  const logged = new Set(logs.map((l) => l.date));
  const days = lastDays(today, period);
  // sparkline: số ngày có log trong 7 ngày gần nhất tính tới mỗi ngày (mượt hơn chuỗi 0/1)
  const series = days.map((d) => lastDays(d, 7).filter((x) => logged.has(x)).length);
  const left = thesisDeadline ? daysBetween(today, thesisDeadline) : null;
  return {
    left,
    series,
    logged: days.filter((d) => logged.has(d)).length,
    tone: (left === null ? "good" : left <= 14 ? "bad" : left <= 30 ? "warn" : "good") as Tone,
  };
}

// ---------- 4.2 task theo dự án ----------

export function tasksByProject(tasks: DashTask[]) {
  const rank = (p: string) => {
    const i = PROJECT_ORDER.indexOf(p);
    return i === -1 ? (p === NO_PROJECT ? PROJECT_ORDER.length + 1 : PROJECT_ORDER.length) : i;
  };
  const groups = new Map<string, { project: string; doing: number; todo: number }>();
  for (const t of tasks) {
    if (isDone(t)) continue;
    const project = t.project ?? NO_PROJECT;
    const g = groups.get(project) ?? { project, doing: 0, todo: 0 };
    if (t.status === "Đang làm") g.doing++;
    else g.todo++;
    groups.set(project, g);
  }
  return [...groups.values()].sort((a, b) => rank(a.project) - rank(b.project));
}

// ---------- 4.3 nhịp làm & học theo tuần ----------

export function weeklyRhythm({ today, tasks, knowledge }: DashInput, weeks = 12) {
  const thisMonday = mondayOf(today);
  const rows = Array.from({ length: weeks }, (_, i) => {
    const week = addDays(thisMonday, (i - weeks + 1) * 7);
    const end = addDays(week, 6);
    const inWeek = (d: string | null) => d !== null && d >= week && d <= end;
    return {
      week,
      done: tasks.filter((t) => isDone(t) && inWeek(t.doneOn)).length,
      learned: knowledge.filter(inWeek).length,
    };
  });
  const sum = (part: typeof rows) => part.reduce((s, r) => s + r.done + r.learned, 0);
  return { rows, change: change(sum(rows.slice(-4)), sum(rows.slice(-8, -4))) };
}

// ---------- 4.4 nhịp hằng ngày ----------

export function dailyRhythm({ today, logs }: DashInput, period: Period) {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const days = lastDays(today, period).map((date) => {
    const log = byDate.get(date);
    return {
      date,
      hasLog: Boolean(log),
      done: log?.doneCount ?? 0,
      exercised: log?.exercised ?? false,
      dropped: log?.dropped ?? false,
    };
  });
  return {
    days,
    logged: days.filter((d) => d.hasLog).length,
    exercised: days.filter((d) => d.exercised).length,
    dropped: days.filter((d) => d.dropped).length,
  };
}

// ---------- thói quen (SPEC-v0.4 3.3) ----------

/**
 * % từng thói quen trong kỳ: số ngày đã làm / số ngày thói quen **được theo dõi** trong kỳ (thói quen mới thêm
 * giữa kỳ không bị kéo tụt). Chuỗi (streak) tính trên toàn bộ Daily Log đã tải.
 */
export function habitKpis({ today, logs, habits }: DashInput, period: Period) {
  const days = lastDays(today, period);
  const rows = [...habits]
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "vi"))
    .map((h) => {
      const tracked = days.filter((d) => isHabitActive(h, monthOf(d)));
      const done = new Set(logs.filter((l) => l.habits.includes(h.name)).map((l) => l.date));
      const count = tracked.filter((d) => done.has(d)).length;
      const { current, best } = streaks(done, today);
      return {
        name: h.name,
        count,
        days: tracked.length,
        pct: tracked.length ? Math.round((count / tracked.length) * 100) : 0,
        streak: current,
        best,
      };
    })
    .filter((r) => r.days > 0);
  const average = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : null;
  return { rows, average };
}

// ---------- sắp đến hạn (SPEC-v0.5 4.4, câu 10.3a) ----------

/** Task chưa xong có Hạn ≤ hôm nay + `horizon` (gồm quá hạn), gần nhất trước; tối đa `max`, còn lại đếm vào `more`. */
export function dueSoon({ today, tasks }: DashInput, horizon = 14, max = 5) {
  const list = tasks
    .filter((t): t is DashTask & { deadline: string } => !isDone(t) && t.deadline !== null && daysBetween(today, t.deadline) <= horizon)
    .map((t) => ({ ...t, daysLeft: daysBetween(today, t.deadline) }))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  return { items: list.slice(0, max), more: Math.max(0, list.length - max) };
}
