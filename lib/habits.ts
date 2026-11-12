// Thói quen (SPEC.md mục 5.3). Hàm thuần; tháng là "YYYY-MM", ngày là "YYYY-MM-DD" (giờ VN).
import { addDays } from "./date";
import type { Habit } from "./types";
import { daysOfMonth, monthOf } from "./period";

/** Thói quen có sẵn cột checkbox riêng trong Daily Log từ v0.1 — ngày cũ chỉ tích checkbox vẫn tính là đã làm. */
export const LEGACY_EXERCISE = "Tập thể dục";

export const MAX_HABIT_NAME = 60;

/** Các thói quen đã làm trong một ngày Daily Log: cột "Thói quen" + checkbox "Tập thể dục" cũ. */
export function doneHabits(log: { habits: string[]; exercised: boolean }): string[] {
  return log.exercised && !log.habits.includes(LEGACY_EXERCISE) ? [...log.habits, LEGACY_EXERCISE] : log.habits;
}

/** Thói quen có được theo dõi trong tháng `month` không: Từ tháng ≤ month ≤ Đến tháng (trống = vẫn theo dõi). */
export const isHabitActive = (h: Habit, month: string) => monthOf(h.from) <= month && (h.to === null || monthOf(h.to) >= month);

/** Thói quen theo dõi trong tháng `month`, theo thứ tự. */
export function habitsForMonth(habits: Habit[], month: string): Habit[] {
  return habits
    .filter((h) => isHabitActive(h, month))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "vi"));
}

/** Chuỗi ngày liên tiếp: `current` tính tới hôm nay (hôm nay chưa tích thì tính tới hôm qua), `best` là dài nhất. */
export function streaks(done: Set<string>, today: string): { current: number; best: number } {
  let current = 0;
  for (let d = done.has(today) ? today : addDays(today, -1); done.has(d); d = addDays(d, -1)) current++;
  let best = 0;
  for (const d of done) {
    if (done.has(addDays(d, -1))) continue; // chỉ đếm từ ngày đầu mỗi chuỗi
    let run = 1;
    while (done.has(addDays(d, run))) run++;
    best = Math.max(best, run);
  }
  return { current, best };
}

export type HabitRow = { habit: Habit; done: Set<string>; count: number; pct: number; streak: number; best: number };

/**
 * Số liệu bảng thói quen của tháng (SPEC.md mục 5.3).
 * % thói quen chia cho số ngày **đã qua** của tháng (tháng hiện tại), không chia cả tháng → đầu tháng không bị thấp vô lý.
 * `doneByDay`: ngày → tên thói quen đã làm (đã gộp checkbox cũ bằng `doneHabits`).
 */
export function monthStats(habits: Habit[], doneByDay: Record<string, string[]>, month: string, today: string) {
  const days = daysOfMonth(month);
  const elapsedDays = days.filter((d) => d <= today);
  const rows: HabitRow[] = habitsForMonth(habits, month).map((habit) => {
    const all = new Set(Object.keys(doneByDay).filter((d) => doneByDay[d].includes(habit.name)));
    const done = new Set(elapsedDays.filter((d) => all.has(d)));
    const { current, best } = streaks(all, today);
    return {
      habit,
      done,
      count: done.size,
      pct: elapsedDays.length ? Math.round((done.size / elapsedDays.length) * 100) : 0,
      streak: current,
      best,
    };
  });
  const dayPct: Record<string, number | null> = Object.fromEntries(
    days.map((d) => [
      d,
      d > today || rows.length === 0 ? null : Math.round((rows.filter((r) => r.done.has(d)).length / rows.length) * 100),
    ]),
  );
  return { days, elapsed: elapsedDays.length, rows, dayPct };
}

/** Bật/tắt một thói quen trong danh sách của ngày, giữ thứ tự ổn định. */
export function toggleHabit(list: string[], name: string, on: boolean): string[] {
  const rest = list.filter((n) => n !== name);
  return on ? [...rest, name] : rest;
}

/**
 * % một thói quen trong khoảng [start, end] tính tới hôm nay (SPEC.md mục 5.3): số ngày đã làm / số ngày đã qua mà thói
 * quen được theo dõi. Chưa có ngày nào được theo dõi (kỳ tương lai, thói quen chưa bắt đầu) → null.
 */
export function habitPeriodPct(habit: Habit, doneByDay: Record<string, string[]>, start: string, end: string, today: string) {
  let tracked = 0;
  let count = 0;
  for (let d = start; d <= end && d <= today; d = addDays(d, 1)) {
    if (!isHabitActive(habit, monthOf(d))) continue;
    tracked++;
    if (doneByDay[d]?.includes(habit.name)) count++;
  }
  return tracked ? { pct: Math.round((count / tracked) * 100), count, tracked } : null;
}
