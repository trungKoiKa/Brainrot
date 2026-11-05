import { describe, expect, it } from "vitest";
import type { DailyLog, Task } from "./types";
import { tasksOnDay, weekDayCards } from "./week-days";

const task = (id: string, over: Partial<Task>): Task => ({
  id, url: "", title: id, project: null, status: "Chưa làm", priority: null, deadline: null, plannedOn: null, note: "",
  doneOn: null, createdTime: "", goalIds: [], ...over,
});
const log = (date: string, done: string, dropped = ""): DailyLog => ({
  id: date, url: "", title: "", date, done, dropped, learned: "", tomorrowTop3: "", exercised: false, habits: [],
});

describe("Thẻ ngày chế độ Tuần (SPEC-v0.5 4.3)", () => {
  it("task thuộc ngày theo Ngày làm / Ngày xong / Hạn, không lặp, Hạn chỉ khi chưa xếp ngày khác", () => {
    const list = [
      task("lam", { plannedOn: "2026-10-27" }),
      task("xong", { status: "Xong", doneOn: "2026-10-27", plannedOn: "2026-10-25" }),
      task("lam-va-han", { plannedOn: "2026-10-27", deadline: "2026-10-27" }),
      task("han", { deadline: "2026-10-27" }),
      task("han-xep-khac", { deadline: "2026-10-27", plannedOn: "2026-10-28" }),
      task("dang-lam-ngay-xong", { status: "Đang làm", doneOn: "2026-10-27" }),
    ];
    expect(tasksOnDay(list, "2026-10-27").map((t) => [t.id, t.dueOnly])).toEqual([
      ["lam", false], ["xong", false], ["lam-va-han", false], ["han", true],
    ]);
  });

  it("7 thẻ từ Thứ Hai, % = task xong / tổng, ngày trống pct null", () => {
    const cards = weekDayCards(
      "2026-10-26",
      [task("a", { plannedOn: "2026-10-27", status: "Xong", doneOn: "2026-10-27" }), task("b", { plannedOn: "2026-10-27" })],
      [log("2026-10-27", " Xong chương 3 ", "Rơi demo"), log("2026-10-28", "  ")],
    );
    expect(cards.map((c) => c.date)).toEqual([
      "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01",
    ]);
    expect(cards[1]).toMatchObject({ doneCount: 1, total: 2, pct: 50, log: { done: "Xong chương 3", dropped: "Rơi demo" } });
    expect(cards[0].pct).toBeNull();
    expect(cards[2].log).toBeNull();
  });
});
