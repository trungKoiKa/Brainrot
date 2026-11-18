import { describe, expect, it } from "vitest";
import { autoStatus, goalCounts, goalsOf, groupGoals, type Goal } from "./goals";
import { childPeriods, parsePeriod, periodLabel, periodOf, shiftPeriod } from "./period";

const goal = (title: string, o: Partial<Goal> = {}): Goal => ({
  id: title, title, level: "month", start: "2026-10-01", type: "Thường", done: false, habitId: null, threshold: null, taskIds: [], parentId: null, ...o,
});

describe("kỳ Năm / Quý / Tháng / Tuần", () => {
  it("periodOf", () => {
    expect(periodOf("year", "2026-10-26")).toEqual({ level: "year", key: "2026", start: "2026-01-01", end: "2026-12-31" });
    expect(periodOf("quarter", "2026-10-26")).toEqual({ level: "quarter", key: "2026-Q4", start: "2026-10-01", end: "2026-12-31" });
    expect(periodOf("quarter", "2026-02-10").end).toBe("2026-03-31");
    expect(periodOf("month", "2026-02-10")).toEqual({ level: "month", key: "2026-02", start: "2026-02-01", end: "2026-02-28" });
    expect(periodOf("week", "2026-10-28")).toEqual({ level: "week", key: "2026-W44", start: "2026-10-26", end: "2026-11-01" });
  });

  it("tuần ISO qua năm: 29/12/2025–04/01/2026 là 2026-W01", () => {
    expect(periodOf("week", "2026-01-01").key).toBe("2026-W01");
    expect(periodOf("week", "2025-12-29").key).toBe("2026-W01");
    expect(periodOf("week", "2027-01-01").key).toBe("2026-W53"); // 2026 có 53 tuần ISO
  });

  it("parsePeriod đọc lại đúng key, sai định dạng → null", () => {
    for (const [level, key] of [["year", "2026"], ["quarter", "2026-Q4"], ["month", "2026-10"], ["week", "2026-W01"], ["week", "2026-W53"]] as const) {
      expect(parsePeriod(level, key)?.key).toBe(key);
    }
    expect(parsePeriod("week", "2025-W53")).toBeNull(); // 2025 chỉ có 52 tuần ISO
    expect(parsePeriod("quarter", "2026-Q5")).toBeNull();
    expect(parsePeriod("month", "2026-13")).toBeNull();
    expect(parsePeriod("year", "abc")).toBeNull();
  });

  it("shiftPeriod qua năm", () => {
    expect(shiftPeriod(parsePeriod("quarter", "2026-Q4")!, 1).key).toBe("2027-Q1");
    expect(shiftPeriod(parsePeriod("month", "2026-01")!, -1).key).toBe("2025-12");
    expect(shiftPeriod(parsePeriod("week", "2026-W01")!, -1).key).toBe("2025-W52");
    expect(shiftPeriod(parsePeriod("year", "2026")!, 1).key).toBe("2027");
  });

  it("childPeriods: Năm → 4 Quý + 12 Tháng, Quý → 3 Tháng, Tháng → tuần, Tuần → rỗng", () => {
    const y = childPeriods(parsePeriod("year", "2026")!);
    expect(y.filter((p) => p.level === "quarter").map((p) => p.key)).toEqual(["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]);
    expect(y.filter((p) => p.level === "month")).toHaveLength(12);
    expect(childPeriods(parsePeriod("quarter", "2026-Q4")!).map((p) => p.key)).toEqual(["2026-10", "2026-11", "2026-12"]);
    expect(childPeriods(parsePeriod("month", "2026-08")!)).toHaveLength(6);
    expect(childPeriods(parsePeriod("week", "2026-W44")!)).toEqual([]);
  });

  it("periodLabel", () => {
    expect(periodLabel(parsePeriod("quarter", "2026-Q4")!)).toBe("Quý 4/2026");
    expect(periodLabel(parsePeriod("week", "2026-W44")!)).toBe("Tuần 44 · 26/10–1/11");
  });
});

describe("bộ đếm mục tiêu (SPEC.md mục 5.3)", () => {
  it("tích 4/10 → Xong 4 · Đang làm 6 · Tổng 10 · 40%", () => {
    const goals = Array.from({ length: 10 }, (_, i) => goal(`M${i}`, { done: i < 4 }));
    expect(goalCounts(goals)).toEqual({ total: 10, completed: 4, inProgress: 6, progress: 40 });
  });
  it("dòng trống không tính; chưa có mục tiêu → 0%", () => {
    expect(goalCounts([goal("A", { done: true }), goal("  ")])).toEqual({ total: 1, completed: 1, inProgress: 0, progress: 100 });
    expect(goalCounts([])).toEqual({ total: 0, completed: 0, inProgress: 0, progress: 0 });
  });
  it("goalsOf lọc đúng cấp + kỳ; groupGoals Ưu tiên trước", () => {
    const goals = [goal("T", { type: "Thường" }), goal("U", { type: "Ưu tiên" }), goal("Khác kỳ", { start: "2026-11-01" }), goal("Năm", { level: "year", start: "2026-01-01" })];
    const month = goalsOf(goals, parsePeriod("month", "2026-10")!);
    expect(month.map((g) => g.title)).toEqual(["T", "U"]);
    expect(groupGoals(month).map((g) => [g.type, g.goals.map((x) => x.title)])).toEqual([["Ưu tiên", ["U"]], ["Thường", ["T"]]]);
  });
});

describe("tự xong (SPEC.md mục 5.3)", () => {
  const habits = [{ id: "h1", name: "Đọc sách", from: "2026-10-01", to: null, order: 1 }];
  const month = parsePeriod("month", "2026-10")!;
  const ctx = (doneByDay: Record<string, string[]>, taskDone = new Map<string, boolean>()) => ({
    period: month, today: "2026-10-04", habits, doneByDay, taskDone,
  });

  it("theo thói quen: % trong kỳ (tới hôm nay) ≥ ngưỡng → tự xong", () => {
    const g = goal("Đọc 80%", { habitId: "h1", threshold: 75 });
    const three = { "2026-10-01": ["Đọc sách"], "2026-10-02": ["Đọc sách"], "2026-10-03": ["Đọc sách"] };
    expect(autoStatus(g, ctx(three))).toEqual({ autoDone: true, auto: [{ kind: "habit", habit: "Đọc sách", pct: 75, threshold: 75 }] });
    expect(autoStatus(g, ctx({ "2026-10-01": ["Đọc sách"] })).autoDone).toBe(false);
  });

  it("kỳ chưa tới → % null, không tự xong", () => {
    const g = goal("Tháng sau", { habitId: "h1", threshold: 50, start: "2026-11-01" });
    expect(autoStatus(g, { ...ctx({}), period: parsePeriod("month", "2026-11")! })).toEqual({
      autoDone: false,
      auto: [{ kind: "habit", habit: "Đọc sách", pct: null, threshold: 50 }],
    });
  });

  it("theo task: đủ task xong → tự xong; task đã xóa bỏ qua", () => {
    const g = goal("Chương 3", { taskIds: ["t1", "t2", "đã-xóa"] });
    expect(autoStatus(g, ctx({}, new Map([["t1", true], ["t2", false]])))).toEqual({ autoDone: false, auto: [{ kind: "tasks", done: 1, total: 2 }] });
    expect(autoStatus(g, ctx({}, new Map([["t1", true], ["t2", true]]))).autoDone).toBe(true);
  });

  it("không gắn gì → không tự xong; bộ đếm tính cả tự xong", () => {
    expect(autoStatus(goal("A"), ctx({}))).toEqual({ autoDone: false, auto: [] });
    expect(goalCounts([goal("A", { autoDone: true }), goal("B")]).completed).toBe(1);
  });
});
