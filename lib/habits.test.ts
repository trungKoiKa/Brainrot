import { describe, expect, it } from "vitest";
import { doneHabits, habitsForMonth, monthStats, rangeStats, streaks, toggleHabit } from "./habits";
import type { Habit } from "./types";
import { daysOfMonth, shiftMonth, weeksOfMonth } from "./period";

const habit = (name: string, o: Partial<Habit> = {}): Habit => ({
  id: name, name, from: "2026-10-01", to: null, order: 1, ...o,
});

describe("lịch (SPEC.md mục 5.3)", () => {
  it("tháng 2/2026 có 28 ngày, tháng 10 có 31", () => {
    expect(daysOfMonth("2026-02")).toHaveLength(28);
    expect(daysOfMonth("2026-10")).toHaveLength(31);
  });
  it("01/01/2026 là Thứ Năm, nằm ở Tuần 1 (tuần bắt đầu 29/12/2025)", () => {
    const [w1] = weeksOfMonth("2026-01");
    expect(w1.monday).toBe("2025-12-29");
    expect(w1.days.indexOf("2026-01-01")).toBe(3); // Thứ Hai = 0 → Thứ Năm = 3
  });
  it("tuần vắt 2 tháng là cùng một tuần ở cả tháng 12 và tháng 1", () => {
    expect(weeksOfMonth("2025-12").at(-1)?.monday).toBe("2025-12-29");
  });
  it("mỗi tháng 4–6 tuần; tháng có 6 tuần", () => {
    expect(weeksOfMonth("2027-02")).toHaveLength(4); // 01/02/2027 Thứ Hai, 28/02 Chủ nhật
    expect(weeksOfMonth("2026-02")).toHaveLength(5); // 01/02/2026 Chủ nhật
    expect(weeksOfMonth("2026-08")).toHaveLength(6); // 01/08/2026 Thứ Bảy, 31/08 Thứ Hai
  });
  it("shiftMonth qua năm", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});

describe("thói quen", () => {
  it("doneHabits gộp checkbox Tập thể dục cũ, không trùng", () => {
    expect(doneHabits({ habits: ["Đọc sách"], exercised: true })).toEqual(["Đọc sách", "Tập thể dục"]);
    expect(doneHabits({ habits: ["Tập thể dục"], exercised: true })).toEqual(["Tập thể dục"]);
    expect(doneHabits({ habits: [], exercised: false })).toEqual([]);
  });

  it("habitsForMonth: thói quen ngừng không hiện tháng sau, tháng cũ vẫn còn; sắp theo thứ tự", () => {
    const habits = [habit("B", { order: 2 }), habit("A", { order: 1, to: "2026-10-01" }), habit("C", { from: "2026-11-01", order: 3 })];
    expect(habitsForMonth(habits, "2026-10").map((h) => h.name)).toEqual(["A", "B"]);
    expect(habitsForMonth(habits, "2026-11").map((h) => h.name)).toEqual(["B", "C"]);
    expect(habitsForMonth(habits, "2026-09")).toEqual([]);
  });

  it("monthStats: % chia cho số ngày đã qua, ngày tương lai không có %", () => {
    const s = monthStats(
      [habit("Đọc sách"), habit("Thiền", { order: 2 })],
      { "2026-10-01": ["Đọc sách"], "2026-10-02": ["Đọc sách", "Thiền"], "2026-10-05": ["Đọc sách"] },
      "2026-10",
      "2026-10-04",
    );
    expect(s.days).toHaveLength(31);
    expect(s.elapsed).toBe(4);
    expect(s.rows.map((r) => [r.habit.name, r.count, r.pct])).toEqual([
      ["Đọc sách", 2, 50], // ngày 05 chưa tới → không tính
      ["Thiền", 1, 25],
    ]);
    expect(s.dayPct["2026-10-02"]).toBe(100);
    expect(s.dayPct["2026-10-03"]).toBe(0);
    expect(s.dayPct["2026-10-05"]).toBeNull();
  });

  it("tháng đã qua chia cho cả tháng", () => {
    const s = monthStats([habit("A", { from: "2026-09-01" })], { "2026-09-01": ["A"] }, "2026-09", "2026-10-26");
    expect(s.elapsed).toBe(30);
    expect(s.rows[0].pct).toBe(3);
  });

  it("streaks: hôm nay chưa tích vẫn giữ chuỗi tới hôm qua", () => {
    const done = new Set(["2026-10-20", "2026-10-21", "2026-10-23", "2026-10-24", "2026-10-25"]);
    expect(streaks(done, "2026-10-26")).toEqual({ current: 3, best: 3 });
    expect(streaks(new Set(["2026-10-26"]), "2026-10-26")).toEqual({ current: 1, best: 1 });
    expect(streaks(new Set(), "2026-10-26")).toEqual({ current: 0, best: 0 });
  });

  it("toggleHabit", () => {
    expect(toggleHabit(["A"], "B", true)).toEqual(["A", "B"]);
    expect(toggleHabit(["A", "B"], "A", false)).toEqual(["B"]);
    expect(toggleHabit(["A"], "A", true)).toEqual(["A"]);
  });
});

describe("rangeStats: thói quen theo tuần / quý / năm (SPEC.md mục 5.3, 19/11/2026)", () => {
  // Tuần 27/10 → 02/11/2026 vắt qua hai tháng
  const week = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"];

  it("% chỉ chia cho ngày đã qua mà thói quen được theo dõi", () => {
    const novOnly = habit("Đọc sách", { from: "2026-11-01" });
    const s = rangeStats([novOnly], { "2026-11-01": ["Đọc sách"] }, week, "2026-11-01");
    expect(s.rows[0].tracked).toBe(1); // tháng 10 chưa theo dõi → không tính là bỏ
    expect(s.rows[0].pct).toBe(100);
  });

  it("thói quen đã ngừng trước kỳ thì không có hàng", () => {
    const stopped = habit("Chạy", { from: "2026-01-01", to: "2026-09-01" });
    expect(rangeStats([stopped], {}, week, "2026-11-01").rows).toHaveLength(0);
  });

  it("ngày tương lai không vào mẫu số", () => {
    const h = habit("Ngủ sớm");
    const s = rangeStats([h], { "2026-10-26": ["Ngủ sớm"] }, week, "2026-10-27");
    expect(s.elapsed).toBe(2);
    expect(s.rows[0]).toMatchObject({ count: 1, tracked: 2, pct: 50 });
  });
});
