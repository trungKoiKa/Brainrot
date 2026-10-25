import { describe, expect, it } from "vitest";
import { sampleDashboard } from "./sample";
import {
  backlogKpi,
  change,
  dailyRhythm,
  doneKpi,
  lastDays,
  mondayOf,
  openOn,
  plannerKpi,
  plannerLanes,
  tasksByProject,
  thesisKpi,
  weeklyRhythm,
  type DashInput,
  type DashTask,
} from "./stats";

const today = "2026-10-26"; // thứ Hai
const t = (o: Partial<DashTask> = {}): DashTask => ({
  project: null, status: "Chưa làm", deadline: null, doneOn: null, createdOn: "2026-10-01", ...o,
});
const input = (o: Partial<DashInput> = {}): DashInput => ({
  today, tasks: [], knowledge: [], logs: [], planner: null, thesisDeadline: "2026-12-06", ...o,
});

describe("ngày", () => {
  it("lastDays cũ → mới, kết thúc ở ngày cho trước", () => {
    expect(lastDays(today, 3)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26"]);
  });
  it("mondayOf", () => {
    expect(mondayOf("2026-10-26")).toBe("2026-10-26");
    expect(mondayOf("2026-11-01")).toBe("2026-10-26"); // Chủ nhật
    expect(mondayOf("2026-10-29")).toBe("2026-10-26");
  });
  it("change: kỳ trước 0 → null", () => {
    expect(change(5, 0)).toBeNull();
    expect(change(6, 4)).toBe(50);
    expect(change(3, 4)).toBe(-25);
  });
});

describe("thẻ số liệu", () => {
  it("openOn: tính task tạo trước ngày, chưa xong vào ngày đó; xong không có ngày → đã đóng", () => {
    const tasks = [
      t({ createdOn: "2026-10-20" }),
      t({ createdOn: "2026-10-20", status: "Xong", doneOn: "2026-10-25" }),
      t({ createdOn: "2026-10-20", status: "Xong", doneOn: null }),
      t({ createdOn: "2026-10-26" }),
    ];
    expect(openOn(tasks, "2026-10-24")).toBe(2);
    expect(openOn(tasks, "2026-10-25")).toBe(1);
    expect(openOn(tasks, "2026-10-26")).toBe(2);
  });

  it("backlog: quá hạn → đỏ, sắp hạn → vàng", () => {
    expect(backlogKpi(input({ tasks: [t({ deadline: "2026-10-20" })] }), 7)).toMatchObject({ value: 1, overdue: 1, tone: "bad" });
    expect(backlogKpi(input({ tasks: [t({ deadline: "2026-10-28" })] }), 7).tone).toBe("warn");
    expect(backlogKpi(input({ tasks: [t({ deadline: "2026-11-20" })] }), 7).tone).toBe("good");
  });

  it("done: đếm theo Ngày xong trong kỳ và so với kỳ trước", () => {
    const tasks = [
      t({ status: "Xong", doneOn: "2026-10-26" }),
      t({ status: "Xong", doneOn: "2026-10-22" }),
      t({ status: "Xong", doneOn: "2026-10-18" }), // kỳ trước (7 ngày)
    ];
    const k = doneKpi(input({ tasks }), 7);
    expect(k.value).toBe(2);
    expect(k.series).toHaveLength(7);
    expect(k.change).toBe(100);
    expect(k.perDay).toBe(0.3);
  });

  it("planner: % tuần này, so điểm % với tuần đã lưu gần nhất", () => {
    const k = plannerKpi({
      thisWeek: { done: 3, total: 4 },
      history: [{ weekStart: "2026-10-19", done: 1, total: 2 }],
      projects: [],
    });
    expect(k).toMatchObject({ value: 75, change: 25, tone: "good", series: [50, 75] });
  });

  it("đồ án: số ngày còn lại + số ngày có log", () => {
    const logs = [{ date: "2026-10-26", doneCount: 2, exercised: false, dropped: false }];
    expect(thesisKpi(input({ logs }), 7)).toMatchObject({ left: 41, logged: 1, tone: "good" });
    expect(thesisKpi(input({ thesisDeadline: "2026-11-05" }), 7).tone).toBe("bad");
  });
});

describe("biểu đồ", () => {
  it("tasksByProject: chỉ task chưa xong, theo thứ tự dự án, không dự án ở cuối", () => {
    const rows = tasksByProject([
      t({ project: "Khác" }),
      t({ project: null, status: "Đang làm" }),
      t({ project: "Đồ án", status: "Đang làm" }),
      t({ project: "Đồ án" }),
      t({ project: "Học AI", status: "Xong" }),
    ]);
    expect(rows).toEqual([
      { project: "Đồ án", doing: 1, todo: 1 },
      { project: "Khác", doing: 0, todo: 1 },
      { project: "Không có dự án", doing: 1, todo: 0 },
    ]);
  });

  it("weeklyRhythm: 12 tuần, tuần cuối là tuần hiện tại", () => {
    const { rows } = weeklyRhythm(input({
      tasks: [t({ status: "Xong", doneOn: "2026-10-27" })],
      knowledge: ["2026-10-20", "2026-10-26"],
    }));
    expect(rows).toHaveLength(12);
    expect(rows.at(-1)).toEqual({ week: "2026-10-26", done: 1, learned: 1 });
    expect(rows.at(-2)).toEqual({ week: "2026-10-19", done: 0, learned: 1 });
  });

  it("dailyRhythm: ngày không có log vẫn có cột", () => {
    const r = dailyRhythm(input({ logs: [{ date: "2026-10-25", doneCount: 3, exercised: true, dropped: true }] }), 7);
    expect(r.days).toHaveLength(7);
    expect(r).toMatchObject({ logged: 1, exercised: 1, dropped: 1 });
    expect(r.days.at(-2)).toMatchObject({ date: "2026-10-25", done: 3 });
  });

  it("plannerLanes: chậm nhất lên đầu, bỏ dự án chưa có slot, gộp phần dư", () => {
    const projects = [
      { name: "A", done: 3, total: 4 },
      { name: "B", done: 1, total: 4 },
      { name: "C", done: 0, total: 0 },
      { name: "D", done: 2, total: 4 },
    ];
    const { lanes, more } = plannerLanes({ thisWeek: { done: 0, total: 0 }, history: [], projects }, 2);
    expect(lanes.map((l) => l.name)).toEqual(["B", "D"]);
    expect(more).toBe(1);
  });
});

describe("dữ liệu mẫu", () => {
  it("cùng ngày → giống hệt nhau, đủ dữ liệu cho mọi khối", () => {
    const a = sampleDashboard(today);
    expect(sampleDashboard(today)).toEqual(a);
    expect(a.tasks.some((x) => x.status === "Xong" && x.doneOn)).toBe(true);
    expect(a.tasks.some((x) => x.status !== "Xong")).toBe(true);
    expect(a.knowledge.length).toBeGreaterThan(10);
    expect(a.logs.length).toBeGreaterThan(30);
    expect(a.planner?.projects.length).toBe(4);
    expect(a.tasks.every((x) => !x.doneOn || x.doneOn <= today)).toBe(true);
  });
});
