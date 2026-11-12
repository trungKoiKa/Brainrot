import "server-only";
import { todayVN } from "@/lib/date";
import { autoStatus, type Goal } from "@/lib/goals";
import { doneHabits } from "@/lib/habits";
import { periodOf } from "@/lib/period";
import type { DailyLog } from "@/lib/types";
import { getDailyLogsBetween, getHabits, getTasks } from "./data";

/**
 * Gắn trạng thái tự xong (SPEC.md mục 5.3) cho các mục tiêu: chỉ tải Daily Log cho khoảng thời gian mà các mục tiêu có
 * gắn thói quen cần (một truy vấn, có cache), và Tasks (đã cache cho các trang khác).
 */
export async function resolveGoals(
  goals: Goal[],
  /**
   * Daily Log trang đã tải sẵn cho khoảng [from, to] → nếu phủ đủ khoảng cần thì không truy vấn thêm một vòng (rà soát A4).
   * Khoảng không phủ đủ → vẫn tự đọc, nên truyền sai chỉ làm chậm chứ không làm sai số.
   */
  prefetched?: { logs: DailyLog[]; from: string; to: string },
): Promise<Goal[]> {
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
    start ? (prefetched && prefetched.from <= start && end <= prefetched.to ? prefetched.logs : getDailyLogsBetween(start, end)) : null,
    withTasks ? getTasks() : null,
  ]);

  const doneByDay: Record<string, string[]> = {};
  for (const l of logs ?? []) if (l.date) doneByDay[l.date] = doneHabits(l);
  const taskDone = new Map((tasks ?? []).map((t) => [t.id, t.status === "Xong"]));

  return goals.map((g) => ({
    ...g,
    ...autoStatus(g, { period: periodFor(g), today, habits: habits ?? [], doneByDay, taskDone }),
  }));
}
