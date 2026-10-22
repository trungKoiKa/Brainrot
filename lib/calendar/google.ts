import "server-only";
import { cacheLife } from "next/cache";
import { addDays } from "@/lib/date";
import type { CalendarEvent } from "@/lib/next-up";

// Google Calendar chỉ đọc (SPEC-v0.2 mục 4.4): gọi REST trực tiếp bằng fetch, không thêm thư viện googleapis.

const ENV = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"] as const;

export type CalendarResult =
  | { ok: true; events: CalendarEvent[] }
  | { ok: false; reason: "not-configured" | "auth" | "error"; error?: string };

export const isCalendarConfigured = () => ENV.every((name) => Boolean(process.env[name]));

class GoogleAuthError extends Error {}

/** Đổi refresh token lấy access token (sống ~1 giờ). */
async function accessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  // invalid_grant = refresh token hết hạn / bị thu hồi; invalid_client = sai client ID/secret
  if (!res.ok || !body.access_token) throw new GoogleAuthError(body.error ?? `HTTP ${res.status}`);
  return body.access_token;
}

type GoogleTime = { date?: string; dateTime?: string };
type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  location?: string;
  hangoutLink?: string;
  htmlLink?: string;
  start: GoogleTime;
  end: GoogleTime;
  attendees?: { self?: boolean; responseStatus?: string }[];
};

function toEvent(e: GoogleEvent): CalendarEvent | null {
  if (e.status === "cancelled") return null;
  if (e.attendees?.some((a) => a.self && a.responseStatus === "declined")) return null;
  const start = e.start.dateTime ?? e.start.date;
  const end = e.end.dateTime ?? e.end.date;
  if (!start || !end) return null;
  return {
    id: e.id,
    title: e.summary?.trim() || "(Không có tiêu đề)",
    start,
    end,
    allDay: !e.start.dateTime,
    location: e.location?.trim() || null,
    meetUrl: e.hangoutLink ?? null,
    url: e.htmlLink ?? null,
  };
}

async function listEvents(token: string, calendarId: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "50" });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (res.status === 401 || res.status === 403) throw new GoogleAuthError(`HTTP ${res.status} (${calendarId})`);
  if (!res.ok) throw new Error(`Calendar HTTP ${res.status} (${calendarId})`);
  const body = (await res.json()) as { items?: GoogleEvent[] };
  return (body.items ?? []).flatMap((e) => toEvent(e) ?? []);
}

/** Sự kiện hôm nay + ngày mai (giờ VN) của các lịch trong GOOGLE_CALENDAR_IDS. Cache 5 phút; lỗi chỉ giữ 30 giây. */
export async function calendarEvents(today: string): Promise<CalendarResult> {
  "use cache";
  if (!isCalendarConfigured()) return { ok: false, reason: "not-configured" };
  const ids = (process.env.GOOGLE_CALENDAR_IDS || "primary").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const token = await accessToken();
    const timeMin = `${today}T00:00:00+07:00`;
    const timeMax = `${addDays(today, 2)}T00:00:00+07:00`;
    const lists = await Promise.all(ids.map((id) => listEvents(token, id, timeMin, timeMax)));
    cacheLife({ stale: 300, revalidate: 300, expire: 60 * 60 });
    return { ok: true, events: lists.flat() };
  } catch (e) {
    cacheLife({ stale: 0, revalidate: 30, expire: 60 });
    const error = e instanceof Error ? e.message : String(e);
    console.error("Google Calendar lỗi:", error);
    return { ok: false, reason: e instanceof GoogleAuthError ? "auth" : "error", error };
  }
}
