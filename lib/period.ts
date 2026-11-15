// Lịch cho trang Mục tiêu (SPEC.md mục 5.3). Tháng là chuỗi "YYYY-MM", ngày là "YYYY-MM-DD" (giờ VN).
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

// ---------- Kỳ Năm / Quý / Tháng / Tuần (SPEC.md mục 5.3) ----------

export type Level = "year" | "quarter" | "month" | "week";
export const LEVELS: Level[] = ["year", "quarter", "month", "week"];
export const LEVEL_LABEL: Record<Level, string> = { year: "Năm", quarter: "Quý", month: "Tháng", week: "Tuần" };

/** Một kỳ: `key` dùng trên URL (2026 · 2026-Q4 · 2026-10 · 2026-W44), `start` = ngày đầu kỳ (cột "Kỳ" trong Goals). */
export type Period = { level: Level; key: string; start: string; end: string };

const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (month: string) => {
  const days = daysOfMonth(month);
  return days[days.length - 1];
};

/** Tuần ISO: tuần 1 là tuần chứa ngày 4/1; năm của tuần là năm chứa thứ Năm của tuần đó. */
function isoWeekKey(monday: string): string {
  const year = Number(addDays(monday, 3).slice(0, 4));
  const firstMonday = mondayOf(`${year}-01-04`);
  const week = Math.round((Date.parse(monday) - Date.parse(firstMonday)) / (7 * 86_400_000)) + 1;
  return `${year}-W${pad(week)}`;
}

function build(level: Level, start: string): Period {
  const year = start.slice(0, 4);
  switch (level) {
    case "year":
      return { level, key: year, start: `${year}-01-01`, end: `${year}-12-31` };
    case "quarter": {
      const q = Math.floor((Number(start.slice(5, 7)) - 1) / 3) + 1;
      const first = `${year}-${pad(q * 3 - 2)}`;
      return { level, key: `${year}-Q${q}`, start: `${first}-01`, end: lastDay(shiftMonth(first, 2)) };
    }
    case "month":
      return { level, key: monthOf(start), start: `${monthOf(start)}-01`, end: lastDay(monthOf(start)) };
    case "week": {
      const monday = mondayOf(start);
      return { level, key: isoWeekKey(monday), start: monday, end: addDays(monday, 6) };
    }
  }
}

/** Kỳ cấp `level` chứa ngày `day`. */
export const periodOf = (level: Level, day: string): Period => build(level, day);

/** Đọc `key` trên URL; sai định dạng → null. */
export function parsePeriod(level: Level, key: string): Period | null {
  let start: string | null = null;
  if (level === "year" && /^\d{4}$/.test(key)) start = `${key}-01-01`;
  const q = /^(\d{4})-Q([1-4])$/.exec(key);
  if (level === "quarter" && q) start = `${q[1]}-${pad(Number(q[2]) * 3 - 2)}-01`;
  if (level === "month" && isMonthKey(key)) start = `${key}-01`;
  const w = /^(\d{4})-W(\d{2})$/.exec(key);
  if (level === "week" && w) start = addDays(mondayOf(`${w[1]}-01-04`), (Number(w[2]) - 1) * 7);
  if (!start) return null;
  const p = build(level, start);
  return p.key === key ? p : null; // vd. 2026-W60 không tồn tại
}

/** Kỳ cùng cấp dịch `n` kỳ. */
export function shiftPeriod(p: Period, n: number): Period {
  switch (p.level) {
    case "year":
      return build("year", `${Number(p.key) + n}-01-01`);
    case "quarter":
      return build("quarter", `${shiftMonth(monthOf(p.start), 3 * n)}-01`);
    case "month":
      return build("month", `${shiftMonth(p.key, n)}-01`);
    case "week":
      return build("week", addDays(p.start, 7 * n));
  }
}

/** Kỳ con để vẽ biểu đồ: Năm → 4 Quý + 12 Tháng · Quý → 3 Tháng · Tháng → các Tuần (4–6) · Tuần → không có. */
export function childPeriods(p: Period): Period[] {
  switch (p.level) {
    case "year":
      return [
        ...[0, 3, 6, 9].map((m) => build("quarter", `${shiftMonth(monthOf(p.start), m)}-01`)),
        ...Array.from({ length: 12 }, (_, m) => build("month", `${shiftMonth(monthOf(p.start), m)}-01`)),
      ];
    case "quarter":
      return [0, 1, 2].map((m) => build("month", `${shiftMonth(monthOf(p.start), m)}-01`));
    case "month":
      return weeksOfMonth(p.key).map((w) => build("week", w.monday));
    case "week":
      return [];
  }
}

export function periodLabel(p: Period): string {
  switch (p.level) {
    case "year":
      return `Năm ${p.key}`;
    case "quarter":
      return `Quý ${p.key.slice(6)}/${p.key.slice(0, 4)}`;
    case "month":
      return monthLabel(p.key);
    case "week": {
      const f = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;
      return `Tuần ${Number(p.key.slice(6))} · ${f(p.start)}–${f(p.end)}`;
    }
  }
}

/** Nhãn ngắn trên cột biểu đồ kỳ con. */
export function shortLabel(p: Period): string {
  if (p.level === "quarter") return `Q${p.key.slice(6)}`;
  if (p.level === "month") return `T${Number(p.key.slice(5))}`;
  if (p.level === "week") return `${Number(p.start.slice(8))}/${Number(p.start.slice(5, 7))}`;
  return p.key;
}

/** Đường dẫn trang Goal mở đúng kỳ `p`. */
export const goalsHref = (p: Period) => `/goals?level=${p.level}&period=${p.key}`;
