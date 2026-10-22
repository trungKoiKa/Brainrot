import { describe, expect, it } from "vitest";
import { pickNextUp, timeRange, type CalendarEvent } from "./next-up";

const ev = (id: string, start: string, end: string, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  title: id,
  start,
  end,
  allDay: start.length === 10,
  location: null,
  meetUrl: null,
  url: null,
  ...extra,
});

const TODAY = "2026-10-22";
const at = (hhmm: string, day = TODAY) => new Date(`${day}T${hhmm}:00+07:00`);

const EVENTS = [
  ev("sáng", "2026-10-22T08:00:00+07:00", "2026-10-22T09:00:00+07:00"),
  ev("họp", "2026-10-22T10:00:00+07:00", "2026-10-22T11:30:00+07:00"),
  ev("chiều", "2026-10-22T15:00:00+07:00", "2026-10-22T16:00:00+07:00"),
  ev("cả ngày", "2026-10-22", "2026-10-23"),
  ev("mai muộn", "2026-10-23T14:00:00+07:00", "2026-10-23T15:00:00+07:00"),
  ev("mai sớm", "2026-10-23T07:30:00+07:00", "2026-10-23T08:00:00+07:00"),
];

describe("pickNextUp", () => {
  it("bỏ sự kiện đã kết thúc, cả ngày đứng đầu, đánh dấu đang diễn ra", () => {
    const r = pickNextUp(EVENTS, at("10:15"), TODAY);
    expect(r.day).toBe("today");
    expect(r.items.map((e) => [e.id, e.ongoing])).toEqual([
      ["cả ngày", false],
      ["họp", true],
      ["chiều", false],
    ]);
  });
  it("hết sự kiện hôm nay → sự kiện sớm nhất ngày mai", () => {
    const r = pickNextUp(EVENTS.filter((e) => e.id !== "cả ngày"), at("20:00"), TODAY);
    expect(r).toMatchObject({ day: "tomorrow", items: [{ id: "mai sớm" }] });
  });
  it("sự kiện qua nửa đêm và sự kiện cả ngày nhiều ngày vẫn tính cho hôm nay", () => {
    const r = pickNextUp(
      [ev("qua đêm", "2026-10-21T23:00:00+07:00", "2026-10-22T01:00:00+07:00"), ev("hội thảo", "2026-10-20", "2026-10-24")],
      at("00:30"),
      TODAY,
    );
    expect(r.items.map((e) => e.id)).toEqual(["hội thảo", "qua đêm"]);
  });
  it("tối đa 5 sự kiện; không có gì → rỗng", () => {
    const many = Array.from({ length: 7 }, (_, i) => ev(`e${i}`, `2026-10-22T1${i}:00:00+07:00`, `2026-10-22T1${i}:30:00+07:00`));
    expect(pickNextUp(many, at("09:00"), TODAY).items).toHaveLength(5);
    expect(pickNextUp([], at("09:00"), TODAY)).toEqual({ day: "tomorrow", items: [] });
  });
});

describe("timeRange", () => {
  it("giờ VN dạng 24h; cả ngày", () => {
    expect(timeRange(ev("a", "2026-10-22T02:00:00Z", "2026-10-22T03:30:00Z"))).toBe("09:00–10:30");
    expect(timeRange(ev("b", "2026-10-22", "2026-10-23"))).toBe("Cả ngày");
  });
});
