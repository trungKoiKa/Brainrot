// Lịch cho trang Mục tiêu (SPEC-v0.4 mục 6.2). Tháng là chuỗi "YYYY-MM", ngày là "YYYY-MM-DD" (giờ VN).
import { addDays, mondayOf } from "./date";

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const isMonthKey = (s: string) => MONTH.test(s);

export const monthOf = (day: string) => day.slice(0, 7);

/** Tháng `key` dịch `n` tháng (âm = lùi). */
export function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const i = y * 12 + (m - 1) + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

/** Mọi ngày của tháng, đúng 28–31 ngày. */
export function daysOfMonth(key: string): string[] {
  const first = `${key}-01`;
  const days: string[] = [];
  for (let d = first; monthOf(d) === key; d = addDays(d, 1)) days.push(d);
  return days;
}

/** Các tuần của tháng: tuần bắt đầu Thứ Hai, Tuần 1 = tuần chứa ngày 1 → 4–6 tuần; mỗi tuần đủ 7 ngày. */
export function weeksOfMonth(key: string): { monday: string; days: string[] }[] {
  const days = daysOfMonth(key);
  const last = days[days.length - 1];
  const weeks = [];
  for (let monday = mondayOf(days[0]); monday <= last; monday = addDays(monday, 7)) {
    weeks.push({ monday, days: Array.from({ length: 7 }, (_, i) => addDays(monday, i)) });
  }
  return weeks;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `Tháng ${Number(m)}/${y}`;
}
