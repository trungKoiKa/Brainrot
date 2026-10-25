import { describe, expect, it } from "vitest";
import type { DailyLog, Knowledge, Task } from "./notion/types";
import { deadlineLabel, latestKnowledge, pickTopThree, splitLines, upcomingDeadlines } from "./today";

const task = (id: string, o: Partial<Task> = {}): Task => ({
  id, url: `u-${id}`, title: id, project: null, status: "Chưa làm", priority: null, deadline: null, note: "",
  doneOn: null, createdTime: "2026-10-01T00:00:00.000Z", ...o,
});
const log = (date: string, tomorrowTop3: string): DailyLog => ({
  id: "l", url: "log-url", title: "", date, done: "", dropped: "", learned: "", tomorrowTop3, exercised: false, habits: [],
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

describe("3 việc hôm nay (SPEC 7.1)", () => {
  it("không có Daily Log hôm qua → Tasks: Ưu tiên rồi deadline gần, không deadline xếp cuối, bỏ Xong", () => {
    const top = pickTopThree(today, [], tasks);
    expect(top.source).toBe("tasks");
    expect(top.items.map((t) => (typeof t === "string" ? t : t.id))).toEqual(["cao-han-gan", "cao-han-xa", "cao-khong-han"]);
  });

  it("Daily Log hôm qua có 'Ngày mai 3 việc' → lấy từ đó, bỏ ký hiệu đầu dòng", () => {
    expect(pickTopThree(today, [log("2026-10-21", "1. Viết chương 2\n- Đọc paper YOLO\n\n• Tập thể dục")], tasks)).toEqual({
      source: "daily", items: ["Viết chương 2", "Đọc paper YOLO", "Tập thể dục"], logUrl: "log-url",
    });
  });

  it("log hôm qua rỗng hoặc log không phải hôm qua → quay về Tasks", () => {
    expect(pickTopThree(today, [log("2026-10-21", "  ")], tasks).source).toBe("tasks");
    expect(pickTopThree(today, [log("2026-10-20", "a")], tasks).source).toBe("tasks");
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
