import { describe, expect, it } from "vitest";
import type { DailyLog, Task } from "./notion/types";
import { tasksOnDay, weekDayCards } from "./week-days";

const task = (id: string, over: Partial<Task>): Task => ({
  id, url: "", title: id, project: null, status: "Chưa làm", priority: null, deadline: null, note: "",
  doneOn: null, createdTime: "", goalIds: [], ...over,
});
const log = (date: string, done: string, dropped = ""): DailyLog => ({
  id: date, url: "", title: "", date, done, dropped, learned: "", tomorrowTop3: "", exercised: false, habits: [],
});

describe("Thẻ ngày chế độ Tuần", () => {
  it("task thuộc ngày theo Deadline hoặc Ngày xong (chỉ khi đã xong)", () => {
    const list = [
      task("a", { deadline: "2026-10-27" }),
      task("b", { status: "Xong", doneOn: "2026-10-27" }),
      task("c", { status: "Đang làm", doneOn: "2026-10-27" }),
      task("d", { deadline: "2026-10-28" }),
    ];
    expect(tasksOnDay(list, "2026-10-27").map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("7 thẻ từ Thứ Hai, % gồm task Notion + ô Planner, ngày trống pct null", () => {
    const cards = weekDayCards(
      "2026-10-26",
      [task("a", { deadline: "2026-10-27", status: "Xong" }), task("b", { deadline: "2026-10-27" })],
      [log("2026-10-27", " Xong chương 3 ", "Rơi demo"), log("2026-10-28", "  ")],
      { tue: [{ id: "s1", title: "Viết", done: true }, { id: "s2", title: "Đọc", done: false }] },
    );
    expect(cards.map((c) => c.date)).toEqual([
      "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01",
    ]);
    expect(cards[1]).toMatchObject({ doneCount: 2, total: 4, pct: 50, log: { done: "Xong chương 3", dropped: "Rơi demo" } });
    expect(cards[0].pct).toBeNull();
    expect(cards[2].log).toBeNull(); // ghi chú chỉ có khoảng trắng
  });
});
