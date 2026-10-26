import "server-only";
import { todayVN } from "@/lib/date";
import { autoStatus, type Goal } from "@/lib/goals";
import { doneHabits } from "@/lib/habits";
import { periodOf } from "@/lib/period";
import { getDailyLogsBetween, getHabits, getTasks, type Loaded } from "./data";

/**
 * Gắn trạng thái tự xong (SPEC-v0.4 4.3) cho các mục tiêu: chỉ tải Daily Log cho khoảng thời gian mà các mục tiêu có
 * gắn thói quen cần (một truy vấn, có cache), và Tasks (đã cache cho các trang khác).
 * Trả kèm các `Loaded` đã dùng để trang tính cờ dữ liệu cũ (stale).
 */
export async function resolveGoals(goals: Goal[]): Promise<{ goals: Goal[]; loaded: Loaded<unknown>[] }> {
  const today = todayVN();
  const periodFor = (g: Goal) => periodOf(g.level, g.start);
  const withHabit = goals.filter((g) => g.habitId && g.threshold !== null);
  const withTasks = goals.some((g) => g.taskIds.length);

  let start = "";
  let end = "";
  for (const g of withHabit) {
    const p = periodFor(g);
    const e = p.end < today ? p.end : today;
    if (p.start > today) continue; // kỳ chưa tới: không cần Daily Log
    if (!start || p.start < start) start = p.start;
    if (!end || e > end) end = e;
  }

  const [habits, logs, tasks] = await Promise.all([
    withHabit.length ? getHabits() : null,
    start ? getDailyLogsBetween(start, end) : null,
    withTasks ? getTasks() : null,
  ]);

  const doneByDay: Record<string, string[]> = {};
  for (const l of logs?.data ?? []) if (l.date) doneByDay[l.date] = doneHabits(l);
  const taskDone = new Map((tasks?.data ?? []).map((t) => [t.id, t.status === "Xong"]));

  return {
    goals: goals.map((g) => ({
      ...g,
      ...autoStatus(g, { period: periodFor(g), today, habits: habits?.data ?? [], doneByDay, taskDone }),
    })),
    loaded: [habits, logs, tasks].filter((l): l is NonNullable<typeof l> => l !== null),
  };
}
