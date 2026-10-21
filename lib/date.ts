// Mọi phép tính ngày theo giờ Việt Nam (SPEC mục 2). Ngày biểu diễn bằng chuỗi YYYY-MM-DD.

export const TIME_ZONE = "Asia/Ho_Chi_Minh";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Ngày hiện tại ở Việt Nam. */
export function todayVN(now: Date = new Date()): string {
  return ymd.format(now);
}

/** Notion trả "2026-12-06" hoặc "2026-12-06T08:00:00.000+07:00" → ngày ở Việt Nam. */
export function toVNDate(start: string): string {
  return start.length === 10 ? start : ymd.format(new Date(start));
}

function toUTC(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  return new Date(toUTC(day) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Số ngày từ `from` đến `to` (âm nếu `to` ở trước). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}
