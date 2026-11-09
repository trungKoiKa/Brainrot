import { describe, expect, it } from "vitest";
import { sampleDashboard } from "./sample";
import {
  backlogKpi,
  change,
  dailyRhythm,
  habitKpis,
  doneKpi,
  lastDays,
  mondayOf,
  openOn,
  dueSoon,
  weekKpi,
  tasksByProject,
  thesisKpi,
  weeklyRhythm,
  weekSummary,
  daysThisWeek,
  type DashInput,
  type DashTask,
} from "./stats";

const today = "2026-10-26"; // thứ Hai
const t = (o: Partial<DashTask> = {}): DashTask => ({
  title: "", url: "", project: null, status: "Chưa làm", deadline: null, doneOn: null, plannedOn: null, createdOn: "2026-10-01", ...o,
});
const input = (o: Partial<DashInput> = {}): DashInput => ({
  today, tasks: [], logs: [], thesisDeadline: "2026-12-06", habits: [], monthGoals: [], ...o,
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

  it("tuần này: % task có Ngày làm trong tuần đã xong, so điểm với tuần trước; tuần trống → null", () => {
    const tasks = [
      t({ plannedOn: "2026-10-26", status: "Xong" }),
      t({ plannedOn: "2026-11-01", status: "Xong" }),
      t({ plannedOn: "2026-10-28" }),
      t({ plannedOn: "2026-11-02" }), // tuần sau
      t({ plannedOn: "2026-10-20", status: "Xong" }),
      t({ plannedOn: "2026-10-21" }),
    ];
    expect(weekKpi(input({ tasks }))).toMatchObject({ value: 67, change: 17, tone: "warn", tally: { done: 2, total: 3 } });
    expect(weekKpi(input({ tasks })).series).toHaveLength(12);
    expect(weekKpi(input())).toMatchObject({ value: null, change: null, tally: { done: 0, total: 0 } });
  });

  it("đồ án: số ngày còn lại + số ngày có log", () => {
    const logs = [{ date: "2026-10-26", doneCount: 2, exercised: false, dropped: false, habits: [] }];
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
      tasks: [t({ status: "Xong", doneOn: "2026-10-27" }), t({ status: "Xong", doneOn: "2026-10-20" })],
    }));
    expect(rows).toHaveLength(12);
    expect(rows.at(-1)).toEqual({ week: "2026-10-26", done: 1 });
    expect(rows.at(-2)).toEqual({ week: "2026-10-19", done: 1 });
  });

  it("dailyRhythm: ngày không có log vẫn có cột", () => {
    const r = dailyRhythm(input({ logs: [{ date: "2026-10-25", doneCount: 3, exercised: true, dropped: true, habits: [] }] }), 7);
    expect(r.days).toHaveLength(7);
    expect(r).toMatchObject({ logged: 1, exercised: 1, dropped: 1 });
    expect(r.days.at(-2)).toMatchObject({ date: "2026-10-25", done: 3 });
  });

  it("dueSoon: chưa xong, Hạn ≤ 14 ngày (gồm quá hạn), gần nhất trước, gộp phần dư", () => {
    const tasks = [
      t({ title: "xa", deadline: "2026-11-09" }), // đúng 14 ngày
      t({ title: "qua-han", deadline: "2026-10-24" }),
      t({ title: "xong", deadline: "2026-10-27", status: "Xong" }),
      t({ title: "mai", deadline: "2026-10-27" }),
      t({ title: "qua-xa", deadline: "2026-11-11" }),
    ];
    const { items, more } = dueSoon(input({ tasks }), 14, 2);
    expect(items.map((x) => [x.title, x.daysLeft])).toEqual([["qua-han", -2], ["mai", 1]]);
    expect(more).toBe(1);
  });
});

describe("thói quen", () => {
  const log = (date: string, habits: string[]) => ({ date, doneCount: 0, exercised: false, dropped: false, habits });
  const habit = (name: string, from: string, order: number) => ({ id: name, name, from, to: null, order });

  it("% chia cho số ngày được theo dõi trong kỳ; thói quen mới thêm giữa kỳ không bị kéo tụt", () => {
    const { rows, average } = habitKpis(
      input({
        today: "2026-11-02",
        habits: [habit("Mới", "2026-11-01", 2), habit("Đọc", "2026-10-01", 1)],
        logs: [log("2026-11-01", ["Đọc", "Mới"]), log("2026-11-02", ["Đọc", "Mới"]), log("2026-10-31", ["Đọc"])],
      }),
      7,
    );
    expect(rows.map((r) => [r.name, r.count, r.days, r.pct, r.streak])).toEqual([
      ["Đọc", 3, 7, 43, 3],
      ["Mới", 2, 2, 100, 2],
    ]);
    expect(average).toBe(72);
  });

  it("chưa có thói quen → không có dòng, average null", () => {
    expect(habitKpis(input(), 30)).toEqual({ rows: [], average: null });
  });
});

describe("dữ liệu mẫu", () => {
  it("cùng ngày → giống hệt nhau, đủ dữ liệu cho mọi khối", () => {
    const a = sampleDashboard(today);
    expect(sampleDashboard(today)).toEqual(a);
    expect(a.tasks.some((x) => x.status === "Xong" && x.doneOn)).toBe(true);
    expect(a.tasks.some((x) => x.status !== "Xong")).toBe(true);
    expect(a.logs.length).toBeGreaterThan(30);
    expect(a.tasks.some((x) => x.plannedOn !== null && x.plannedOn >= mondayOf(today))).toBe(true);
    expect(a.habits).toHaveLength(5);
    expect(a.logs.some((l) => l.habits.length > 0)).toBe(true);
    expect(a.tasks.every((x) => !x.doneOn || x.doneOn <= today)).toBe(true);
  });
});

describe("tóm tắt tuần (thẻ tiêu điểm, 3 tín hiệu từ thứ Hai)", () => {
  // today = 2026-10-26 là thứ Hai → tuần này có 1 ngày; dùng thứ Tư 28/10 cho tuần 3 ngày
  const wed = "2026-10-28";
  const log = (date: string, habits: string[] = []) => ({ date, doneCount: 0, exercised: false, dropped: false, habits });
  const habit = (name: string): DashInput["habits"][number] => ({ id: name, name, from: "2026-01", to: null, order: 0 });

  it("daysThisWeek: thứ Hai = 1, Chủ nhật = 7", () => {
    expect(daysThisWeek("2026-10-26")).toBe(1);
    expect(daysThisWeek("2026-11-01")).toBe(7);
  });

  it("không có gì đo được → nói rõ, không tô màu, không link riêng", () => {
    expect(weekSummary(input())).toMatchObject({ tone: "none", headline: "Chưa có gì để đo.", facts: [], action: null });
  });

  it("quá hạn đứng trước mọi tín hiệu, link sang Tasks", () => {
    const s = weekSummary(input({
      tasks: [t({ plannedOn: today, status: "Xong", doneOn: today }), t({ deadline: "2026-10-20" })],
    }));
    expect(s).toMatchObject({ tone: "bad", headline: "Có 1 việc quá hạn cần xử lý trước.", action: { href: "/tasks" } });
    expect(s.facts).toEqual(["1/1 việc theo lịch", "1 việc xong", "1 việc quá hạn"]);
  });

  it("chưa xếp lịch, chưa có log/thói quen → không chấm xanh, link xếp việc", () => {
    const s = weekSummary(input({ tasks: [t({ status: "Xong", doneOn: today })] }));
    expect(s).toMatchObject({ tone: "none", headline: "Đã xong 1 việc, chưa xếp lịch việc nào.", action: { href: "/today" } });
  });

  it("ghi log tính từ thứ Hai; log tuần trước không tính", () => {
    const s = weekSummary(input({
      today: wed,
      tasks: [t({ plannedOn: wed, status: "Xong", doneOn: wed })],
      logs: [log("2026-10-25"), log(wed)],
    }));
    expect(s.signals.map((x) => [x.key, x.tone])).toEqual([["tasks", "good"], ["log", "bad"]]);
    expect(s).toMatchObject({
      tone: "bad",
      headline: "Đang chậm: mới ghi log 1/3 ngày (việc vẫn ổn).",
      action: { label: "Ghi log hôm nay ở Today", href: "/today" },
    });
    expect(s.facts).toContain("ghi log 1/3 ngày");
  });

  it("mọi tín hiệu ổn → liệt kê, link nhìn lại tuần", () => {
    const days = ["2026-10-26", "2026-10-27", wed];
    const s = weekSummary(input({
      today: wed,
      tasks: [t({ plannedOn: wed, status: "Xong", doneOn: wed })],
      logs: days.map((d) => log(d, ["Đọc sách"])),
      habits: [habit("Đọc sách")],
    }));
    expect(s.tone).toBe("good");
    expect(s.headline).toBe("Đang ổn: xong 100% việc đã xếp lịch, thói quen đạt 100%, ghi log 3/3 ngày.");
    expect(s.action?.href).toBe("/goals?level=week");
  });
});

describe("critique Dashboard vòng 4: không báo động từ mẫu quá ít, chấm trung tính khi thiếu dữ liệu", () => {
  const tue = "2026-10-27"; // thứ Ba: mới trôi qua 1 ngày trọn
  const log = (date: string) => ({ date, doneCount: 0, exercised: false, dropped: false, habits: [] as string[] });
  it("hôm nay chưa ghi log thì không tính là bỏ lỡ; mẫu < 3 ngày không đỏ", () => {
    const s = weekSummary(input({ today: tue, logs: [log("2026-10-26")] }));
    expect(s.signals.find((x) => x.key === "log")).toMatchObject({ tone: "good", ok: "ghi log 1/1 ngày" });
    const none = weekSummary(input({ today: tue, logs: [log("2026-10-20")] }));
    expect(none.signals.find((x) => x.key === "log")).toMatchObject({ tone: "warn", weak: "mới ghi log 0/1 ngày" }); // 0/1 ngày: mẫu quá nhỏ → không đỏ
  });
  it("mẫu nhỏ bỏ lỡ hết chỉ ở mức cần để ý", () => {
    const s = weekSummary(input({ today: tue, logs: [log("2026-10-20"), log(tue)] }));
    expect(s.signals.find((x) => x.key === "log")?.tone).toBe("warn"); // 1/2 ngày = 50% → warn, không đỏ
    const zero = weekSummary(input({ today: "2026-10-28", logs: [log("2026-10-20"), log("2026-10-28")] }));
    expect(zero.signals.find((x) => x.key === "log")?.tone).toBe("bad"); // 1/3 = 33% và đã đủ 3 ngày → đỏ được phép
  });
  it("KPI không có mốc so sánh thì chấm trung tính", () => {
    expect(doneKpi(input(), 7).tone).toBe("none");
    expect(weekKpi(input()).tone).toBe("none");
    expect(thesisKpi(input({ thesisDeadline: null }), 7).tone).toBe("none");
  });
});

describe("đầu tuần không phán xét bằng màu", () => {
  const log = (date: string) => ({ date, doneCount: 0, exercised: false, dropped: false, habits: [] as string[] });
  it("thứ Hai–thứ Ba: tone trung tính, câu mở đầu 'Tuần mới'", () => {
    const s = weekSummary(input({ today: "2026-10-27", logs: [log("2026-10-20")] }));
    expect(s.tone).toBe("none");
    expect(s.headline).toBe("Tuần mới: mới ghi log 0/1 ngày.");
    expect(s.action?.href).toBe("/today");
  });
  it("quá hạn vẫn đỏ kể cả đầu tuần", () => {
    const s = weekSummary(input({ today: "2026-10-27", tasks: [t({ deadline: "2026-10-20" })], logs: [log("2026-10-20")] }));
    expect(s.tone).toBe("bad");
  });
});
