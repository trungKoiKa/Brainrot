// Chọn sự kiện cho thẻ "Next up" trên Today (SPEC-v0.2 mục 4.4). Hàm thuần → test được.
import { TIME_ZONE, addDays } from "./date";

export type CalendarEvent = {
  id: string;
  title: string;
  /** ISO có giờ, hoặc YYYY-MM-DD nếu cả ngày */
  start: string;
  /** Sự kiện cả ngày: ngày kết thúc *không tính* (giống Google) */
  end: string;
  allDay: boolean;
  location: string | null;
  meetUrl: string | null;
  url: string | null;
};

export type NextUpItem = CalendarEvent & { ongoing: boolean };
export type NextUp = { day: "today" | "tomorrow"; items: NextUpItem[] };

export const MAX_TODAY = 5;

/** Có diễn ra (một phần) trong ngày `day` theo giờ VN không. */
function onDay(e: CalendarEvent, day: string): boolean {
  if (e.allDay) return e.start <= day && day < e.end;
  const dayStart = Date.parse(`${day}T00:00:00+07:00`);
  const dayEnd = Date.parse(`${addDays(day, 1)}T00:00:00+07:00`);
  return Date.parse(e.start) < dayEnd && Date.parse(e.end) > dayStart;
}

const startMs = (e: CalendarEvent) => (e.allDay ? Date.parse(`${e.start}T00:00:00+07:00`) : Date.parse(e.start));

/** Cả ngày đứng trước, rồi theo giờ bắt đầu. */
const byStart = (a: CalendarEvent, b: CalendarEvent) =>
  Number(b.allDay) - Number(a.allDay) || startMs(a) - startMs(b) || a.title.localeCompare(b.title, "vi");

export function pickNextUp(events: readonly CalendarEvent[], now: Date, today: string): NextUp {
  const t = now.getTime();
  const remaining = events
    .filter((e) => onDay(e, today) && (e.allDay || Date.parse(e.end) > t))
    .sort(byStart)
    .slice(0, MAX_TODAY)
    .map((e) => ({ ...e, ongoing: !e.allDay && Date.parse(e.start) <= t }));
  if (remaining.length) return { day: "today", items: remaining };

  const first = events.filter((e) => onDay(e, addDays(today, 1))).sort(byStart)[0];
  return { day: "tomorrow", items: first ? [{ ...first, ongoing: false }] : [] };
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "09:00–10:30" theo giờ VN; cả ngày → "Cả ngày". */
export function timeRange(e: CalendarEvent): string {
  if (e.allDay) return "Cả ngày";
  return `${timeFmt.format(new Date(e.start))}–${timeFmt.format(new Date(e.end))}`;
}
