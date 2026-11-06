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

const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" });
const weekdayFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: TIME_ZONE, weekday: "long" });

/** Giờ hiện tại (0–23) theo giờ Việt Nam. */
export const hourVN = (now: Date = new Date()): number => Number(hourFmt.format(now)) % 24;

/**
 * Today coi 0:00–3:59 là tối hôm trước (Trung chốt 06/11/2026): thức khuya vẫn ghi Daily Log cho ngày vừa qua.
 * Chỉ dùng cho Today (lời chào, Daily Log, cụm Cuối ngày); deadline và các màn khác vẫn đổi ngày lúc 0:00.
 */
export const DAY_START_HOUR = 4;

/** Thời điểm lùi lại DAY_START_HOUR giờ: ngày của nó là "ngày làm việc" (giờ VN không có DST). */
export const workdayClock = (now: Date = new Date()): Date => new Date(now.getTime() - DAY_START_HOUR * 3_600_000);

/** Ngày làm việc ở Việt Nam: như todayVN nhưng đổi ngày lúc 4:00. */
export const workdayVN = (now: Date = new Date()): string => todayVN(workdayClock(now));

/** Từ 18:00 tới 3:59 là "cuối ngày": Today mở sẵn Daily Log và chọn việc ngày mai. */
export const isEveningVN = (now: Date = new Date()): boolean => {
  const h = hourVN(now);
  return h >= 18 || h < DAY_START_HOUR;
};

/** "Chào buổi sáng" … theo giờ Việt Nam; 0:00–3:59 vẫn là buổi tối. */
export function greetingVN(now: Date = new Date()): string {
  const h = hourVN(now);
  if (h < DAY_START_HOUR) return "Chào buổi tối";
  if (h < 11) return "Chào buổi sáng";
  if (h < 13) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** "Thứ Năm, 22/10/2026" */
export function longDateVN(now: Date = new Date()): string {
  const w = weekdayFmt.format(now);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}, ${formatDay(todayVN(now))}`;
}

/** "2026-12-06" → "06/12/2026" (bỏ năm nếu `short`) */
export function formatDay(day: string, short = false): string {
  const [y, m, d] = day.split("-");
  return short ? `${d}/${m}` : `${d}/${m}/${y}`;
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

/** "T2"…"T7", "CN" của ngày YYYY-MM-DD. */
export function weekdayShort(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  return dow === 0 ? "CN" : `T${dow + 1}`;
}

/** Thứ Hai của tuần chứa `day` (tuần bắt đầu Thứ Hai). */
export function mondayOf(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((dow + 6) % 7));
}
