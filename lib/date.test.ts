import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDay, greetingVN, longDateVN, toVNDate, todayVN, weekdayShort } from "./date";

describe("ngày theo giờ Việt Nam", () => {
  it("todayVN đổi ngày đúng lúc 0 giờ VN (17:00 UTC)", () => {
    expect(todayVN(new Date("2026-10-21T23:30:00Z"))).toBe("2026-10-22");
    expect(todayVN(new Date("2026-10-22T16:59:00Z"))).toBe("2026-10-22");
    expect(todayVN(new Date("2026-10-22T17:00:00Z"))).toBe("2026-10-23");
  });

  it("toVNDate: giữ nguyên date-only, đổi datetime sang ngày VN", () => {
    expect(toVNDate("2026-12-06")).toBe("2026-12-06");
    expect(toVNDate("2026-12-05T20:00:00.000Z")).toBe("2026-12-06");
  });

  it("addDays qua tháng, daysBetween âm khi đã qua", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
    expect(daysBetween("2026-10-22", "2026-12-06")).toBe(45);
    expect(daysBetween("2026-10-22", "2026-10-20")).toBe(-2);
  });

  it("lời chào theo buổi (giờ VN)", () => {
    expect(greetingVN(new Date("2026-10-22T01:00:00Z"))).toBe("Chào buổi sáng"); // 08:00
    expect(greetingVN(new Date("2026-10-22T05:00:00Z"))).toBe("Chào buổi trưa"); // 12:00
    expect(greetingVN(new Date("2026-10-22T08:00:00Z"))).toBe("Chào buổi chiều"); // 15:00
    expect(greetingVN(new Date("2026-10-22T13:00:00Z"))).toBe("Chào buổi tối"); // 20:00
  });

  it("định dạng ngày", () => {
    expect(formatDay("2026-12-06")).toBe("06/12/2026");
    expect(formatDay("2026-12-06", true)).toBe("06/12");
    expect(longDateVN(new Date("2026-10-22T01:00:00Z"))).toBe("Thứ Năm, 22/10/2026");
  });
});

describe("weekdayShort", () => {
  it("T2…CN", () => {
    expect(weekdayShort("2026-10-26")).toBe("T2");
    expect(weekdayShort("2026-11-01")).toBe("CN");
  });
});
