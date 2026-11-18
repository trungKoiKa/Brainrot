// Mục tiêu xếp tầng (SPEC.md mục 5.3). Hàm thuần.
import { habitPeriodPct } from "./habits";
import type { Habit } from "./types";
import type { Level, Period } from "./period";

export type GoalType = "Ưu tiên" | "Thường";
export const GOAL_TYPES: GoalType[] = ["Ưu tiên", "Thường"];

export type Goal = {
  id: string;
  title: string;
  level: Level;
  /** Cột "Kỳ": ngày đầu kỳ, YYYY-MM-DD */
  start: string;
  type: GoalType;
  /** Cột "Xong" — tích tay */
  done: boolean;
  /** Relation "Thói quen" + "Ngưỡng %" (SPEC.md mục 5.3) */
  habitId: string | null;
  threshold: number | null;
  /** Relation "Tasks" */
  taskIds: string[];
  /** Mục tiêu tuần thuộc mục tiêu tháng nào (SPEC.md mục 12.2); null với cấp khác hoặc chưa gắn */
  parentId: string | null;
  /** Tự xong (chỉ tính trên web, không ghi ngược vào cột Xong) — server tính bằng `autoStatus` */
  autoDone?: boolean;
  auto?: AutoInfo[];
};

export type AutoInfo =
  | { kind: "habit"; habit: string; pct: number | null; threshold: number }
  | { kind: "tasks"; done: number; total: number };

export const DEFAULT_THRESHOLD = 80;

/** Xong = tích tay hoặc tự xong. */
export const isGoalDone = (g: Goal) => g.done || g.autoDone === true;

/**
 * Tự xong (SPEC.md mục 5.3): (a) % thói quen gắn trong kỳ ≥ ngưỡng, hoặc (b) mọi task gắn đã xong.
 * `taskDone`: id task → đã xong chưa; task đã xóa khỏi Notion (không có trong map) thì bỏ qua.
 */
export function autoStatus(
  goal: Goal,
  ctx: { period: Period; today: string; habits: Habit[]; doneByDay: Record<string, string[]>; taskDone: Map<string, boolean> },
): { autoDone: boolean; auto: AutoInfo[] } {
  const auto: AutoInfo[] = [];
  let autoDone = false;

  const habit = goal.habitId ? ctx.habits.find((h) => h.id === goal.habitId) : undefined;
  if (habit && goal.threshold !== null) {
    const pct = habitPeriodPct(habit, ctx.doneByDay, ctx.period.start, ctx.period.end, ctx.today)?.pct ?? null;
    auto.push({ kind: "habit", habit: habit.name, pct, threshold: goal.threshold });
    if (pct !== null && pct >= goal.threshold) autoDone = true;
  }

  const known = goal.taskIds.filter((id) => ctx.taskDone.has(id));
  if (known.length) {
    const done = known.filter((id) => ctx.taskDone.get(id)).length;
    auto.push({ kind: "tasks", done, total: known.length });
    if (done === known.length) autoDone = true;
  }
  return { autoDone, auto };
}

export const MAX_GOAL_TITLE = 300;
/** Template dùng 3 Ưu tiên + 7 Thường; quá 3 Ưu tiên → nhắc nhẹ, không chặn (SPEC.md mục 5.3). */
export const PRIORITY_SOFT_LIMIT = 3;

export const goalsOf = (goals: Goal[], p: Period) => goals.filter((g) => g.level === p.level && g.start === p.start);

/** Bộ đếm SPEC.md mục 5.3: dòng trống không tính. */
export function goalCounts(goals: Goal[]) {
  const named = goals.filter((g) => g.title.trim());
  const completed = named.filter(isGoalDone).length;
  return {
    total: named.length,
    completed,
    inProgress: named.length - completed,
    progress: named.length ? Math.round((completed / named.length) * 100) : 0,
  };
}

/** Ưu tiên trước, Thường sau; trong nhóm giữ thứ tự tạo. */
export function groupGoals(goals: Goal[]) {
  return GOAL_TYPES.map((type) => ({ type, goals: goals.filter((g) => g.type === type) }));
}

/** Câu 4 Nhìn lại đổi chữ theo cấp (SPEC.md mục 5.3) — dùng ở bước 5. */
export const NEXT_LABEL: Record<Level, string> = { year: "năm", quarter: "quý", month: "tháng", week: "tuần" };
