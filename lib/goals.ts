// Mục tiêu xếp tầng (SPEC-v0.4 mục 4). Hàm thuần.
import type { Level, Period } from "./period";

export type GoalType = "Ưu tiên" | "Thường";
export const GOAL_TYPES: GoalType[] = ["Ưu tiên", "Thường"];

/** Tên cấp trong cột "Cấp" của Notion. */
export const LEVEL_NOTION: Record<Level, string> = { year: "Năm", quarter: "Quý", month: "Tháng", week: "Tuần" };

export type Goal = {
  id: string;
  title: string;
  level: Level;
  /** Cột "Kỳ": ngày đầu kỳ, YYYY-MM-DD */
  start: string;
  type: GoalType;
  done: boolean;
};

export const MAX_GOAL_TITLE = 300;
/** Template dùng 3 Ưu tiên + 7 Thường; quá 3 Ưu tiên → nhắc nhẹ, không chặn (SPEC-v0.4 4.2). */
export const PRIORITY_SOFT_LIMIT = 3;

export const goalsOf = (goals: Goal[], p: Period) => goals.filter((g) => g.level === p.level && g.start === p.start);

/** Bộ đếm SPEC-v0.4 4.2: dòng trống không tính. */
export function goalCounts(goals: Goal[]) {
  const named = goals.filter((g) => g.title.trim());
  const completed = named.filter((g) => g.done).length;
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

/** Câu 4 Nhìn lại đổi chữ theo cấp (SPEC-v0.4 mục 5) — dùng ở bước 5. */
export const NEXT_LABEL: Record<Level, string> = { year: "năm", quarter: "quý", month: "tháng", week: "tuần" };
