import { describe, expect, it } from "vitest";
import type { Knowledge, Task } from "./types";
import {
  deadlineLabel,
  latestKnowledge,
  planToday,
  splitLines,
  todayEmptyKind,
  todayProgress,
  tomorrowCandidates,
  upcomingDeadlines,
} from "./today";

const task = (id: string, o: Partial<Task> = {}): Task => ({
  id, url: `u-${id}`, title: id, project: null, status: "Chưa làm", priority: null, deadline: null, plannedOn: null, note: "",
  doneOn: null, createdTime: "2026-10-01T00:00:00.000Z", goalIds: [], ...o,
});
const today = "2026-10-22";
const tasks = [
  task("thap-som", { priority: "Thấp", deadline: "2026-10-23" }),
  task("cao-khong-han", { priority: "Cao" }),
  task("cao-han-xa", { priority: "Cao", deadline: "2026-12-06" }),
  task("cao-han-gan", { priority: "Cao", deadline: "2026-10-26" }),
  task("vua", { priority: "Vừa", deadline: "2026-10-20" }),
  task("xong", { priority: "Cao", deadline: "2026-10-22", status: "Xong" }),
  task("khong-uu-tien", { deadline: "2026-10-22" }),
];

describe("Hôm nay làm (SPEC-v0.5 4.2)", () => {
  const ts = [
    task("lam-nay-thap", { plannedOn: today, priority: "Thấp" }),
    task("lam-nay-cao", { plannedOn: today, priority: "Cao" }),
    task("tre-2", { plannedOn: "2026-10-20" }),
    task("tre-1", { plannedOn: "2026-10-21", priority: "Cao" }),
    task("han-nay", { deadline: today }),
    task("han-nay-da-xep", { deadline: today, plannedOn: today }),
    task("han-nay-xep-mai", { deadline: today, plannedOn: "2026-10-23" }),
    task("xong", { plannedOn: today, status: "Xong" }),
    task("chua-xep", { priority: "Cao" }),
  ];

  it("3 nhóm, đúng thứ tự, task xong không hiện, mỗi task một nhóm", () => {
    const p = planToday(today, ts);
    expect(p.planned.map((t) => t.id)).toEqual(["lam-nay-cao", "lam-nay-thap", "han-nay-da-xep"]);
    expect(p.late.map((t) => [t.id, t.lateDays])).toEqual([["tre-2", 2], ["tre-1", 1]]);
    expect(p.due.map((t) => t.id)).toEqual(["han-nay", "han-nay-xep-mai"]);
    expect(p.suggest).toEqual([]);
  });

  it("không có gì → gợi ý 3 task ưu tiên cao nhất chưa xếp lịch", () => {
    expect(planToday(today, tasks.filter((t) => t.deadline !== today)).suggest.map((t) => t.id)).toEqual(["cao-han-gan", "cao-han-xa", "cao-khong-han"]);
  });

  it("ngày mai: đã xếp ngày mai trước, rồi task chưa xếp; bỏ task xếp ngày khác", () => {
    const ts2 = [task("a", { plannedOn: "2026-10-23" }), task("b", { priority: "Cao" }), task("c", { plannedOn: "2026-10-25" })];
    expect(tomorrowCandidates(today, ts2).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("splitLines bỏ checkbox markdown", () => {
    expect(splitLines("[ ] a\n[x] b\n2) c")).toEqual(["a", "b", "c"]);
  });
});

describe("deadline 14 ngày tới", () => {
  it("gồm quá hạn, bỏ Xong, bỏ quá 14 ngày, sắp theo deadline", () => {
    expect(upcomingDeadlines(today, tasks).map((t) => [t.id, t.daysLeft])).toEqual([
      ["vua", -2], ["khong-uu-tien", 0], ["thap-som", 1], ["cao-han-gan", 4],
    ]);
  });

  it("đúng ngưỡng 14 ngày thì có, 15 thì không", () => {
    const ts = [task("d14", { deadline: "2026-11-05" }), task("d15", { deadline: "2026-11-06" })];
    expect(upcomingDeadlines(today, ts).map((t) => t.id)).toEqual(["d14"]);
  });

  it("nhãn", () => {
    expect([-3, 0, 1, 5].map(deadlineLabel)).toEqual(["Quá hạn 3 ngày", "Hôm nay", "Ngày mai", "Còn 5 ngày"]);
  });
});

describe("kiến thức mới", () => {
  const k = (id: string, learnedOn: string | null, createdTime: string) => ({ id, learnedOn, createdTime }) as Knowledge;

  it("theo Ngày học, thiếu thì dùng created_time; tối đa 5", () => {
    expect(latestKnowledge([k("a", "2026-10-01", "2026-10-21T00:00:00Z"), k("b", null, "2026-10-15T00:00:00Z"), k("c", "2026-10-20", "2026-10-01T00:00:00Z")]).map((x) => x.id)).toEqual(["c", "b", "a"]);
    expect(latestKnowledge(Array.from({ length: 8 }, (_, i) => k(`n${i}`, null, `2026-10-0${i + 1}T00:00:00Z`)))).toHaveLength(5);
  });
});

describe("Hôm nay làm trống và tiến độ (critique 06/11/2026)", () => {
  it("phân biệt kho trống, xong hết, còn việc đã xếp ngày khác", () => {
    expect(todayEmptyKind([])).toBe("no-tasks");
    expect(todayEmptyKind([task("a", { status: "Xong" })])).toBe("all-done");
    expect(todayEmptyKind([task("a", { status: "Xong" }), task("b", { plannedOn: "2026-10-30" })])).toBe("scheduled-later");
  });

  it("x/y xong chỉ đếm việc có Ngày làm hôm nay", () => {
    expect(todayProgress(today, [task("a", { plannedOn: "2026-10-23" })])).toBeNull();
    expect(
      todayProgress(today, [
        task("a", { plannedOn: today, status: "Xong" }),
        task("b", { plannedOn: today }),
        task("c", { plannedOn: "2026-10-21" }),
      ]),
    ).toEqual({ done: 1, total: 2 });
  });
});
