import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "./client";
import {
  createGoal,
  createHabit,
  createIdea,
  createTask,
  markTaskDone,
  saveDailyLog,
  saveReflection,
  setDayHabits,
  setHabitEnd,
  setTaskPlannedOn,
  trashGoal,
  updateGoal,
  updateTask,
} from "./mutations";
import { listDailyLogsBetween, listGoals, listHabits, listProjectNames, listRecentDailyLogs, listReflections, listTasks } from "./queries";
import { DEFAULT_USER_ID, users } from "./schema";
import { createTestDb } from "./test-db";

let db: Db;
let close: () => Promise<void>;
let other: string; // người dùng thứ hai, để thử cách ly

const ME = DEFAULT_USER_ID;
const input = (title: string, extra: Partial<Parameters<typeof createTask>[2]> = {}) => ({ title, project: null, priority: null, deadline: null, plannedOn: null, ...extra });
const update = (title: string, extra = {}) => ({ ...input(title), status: "Đang làm" as const, note: "", ...extra });

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  [{ id: other }] = await db.insert(users).values({ name: "Bạn", email: "ban@example.com" }).returning({ id: users.id });
}, 30_000);
afterAll(() => close());

describe("dự án", () => {
  it("user mặc định có 4 dự án + Chung theo thứ tự; user mới chưa có dự án nào", async () => {
    expect(await listProjectNames(db, ME)).toEqual(["Chung", "Đồ án", "Học AI", "Sản phẩm", "Thực tập"]);
    expect(await listProjectNames(db, other)).toEqual([]);
  });
});

describe("tasks", () => {
  it("tạo → đọc đúng kiểu Task cũ; sửa; tích xong; Ngày làm", async () => {
    await createTask(db, ME, input("Viết chương 3", { project: "Đồ án", priority: "Cao", deadline: "2026-11-08", plannedOn: "2026-10-28" }));
    const [t] = (await listTasks(db, ME)).filter((x) => x.title === "Viết chương 3");
    expect(t).toMatchObject({ project: "Đồ án", priority: "Cao", status: "Chưa làm", deadline: "2026-11-08", plannedOn: "2026-10-28", doneOn: null, goalIds: [], url: "" });

    await updateTask(db, ME, t.id, update("Viết chương 3 (sửa)", { project: null, note: "ghi chú", plannedOn: null }));
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)).toMatchObject({ title: "Viết chương 3 (sửa)", project: null, status: "Đang làm", note: "ghi chú", plannedOn: null });

    await setTaskPlannedOn(db, ME, t.id, "2026-10-30");
    await markTaskDone(db, ME, t.id);
    const done = (await listTasks(db, ME)).find((x) => x.id === t.id)!;
    expect(done.status).toBe("Xong");
    expect(done.plannedOn).toBe("2026-10-30");
    expect(done.doneOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await updateTask(db, ME, t.id, update("Mở lại")); // mở lại → bỏ Ngày xong
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.doneOn).toBeNull();
  });

  it("gắn / bỏ mục tiêu qua goalId; mục tiêu của người khác không gắn được", async () => {
    await createTask(db, ME, input("Gắn mục tiêu"));
    const t = (await listTasks(db, ME)).find((x) => x.title === "Gắn mục tiêu")!;
    const g = await createGoal(db, ME, "week", "2026-10-26", "Mục tiêu tuần", "Ưu tiên");
    const foreign = await createGoal(db, other, "week", "2026-10-26", "Của bạn", "Thường");

    await updateTask(db, ME, t.id, update("Gắn mục tiêu", { goalId: g }));
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([g]);
    expect((await listGoals(db, ME)).find((x) => x.id === g)?.taskIds).toEqual([t.id]);

    await updateTask(db, ME, t.id, update("Gắn mục tiêu", { goalId: foreign }));
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([]); // bị bỏ, không gắn vào goal của người khác

    await updateTask(db, ME, t.id, update("Gắn mục tiêu", { goalId: g }));
    await updateTask(db, ME, t.id, update("Gắn mục tiêu")); // goalId undefined → không đụng
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([g]);
    await updateTask(db, ME, t.id, update("Gắn mục tiêu", { goalId: null }));
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([]);
  });
});

describe("cách ly giữa người dùng", () => {
  it("không đọc được task / goal / thói quen / log của nhau", async () => {
    await createTask(db, other, input("Việc riêng của bạn"));
    await createHabit(db, other, "Thói quen của bạn", "2026-10-01", 1);
    await saveDailyLog(db, other, "2026-10-27", { done: "bí mật", dropped: "", learned: "", exercised: null });
    await saveReflection(db, other, "week", "2026-10-26", { wentWell: "bí mật", lesson: "", grateful: "", nextFocus: "", motto: "" });

    expect((await listTasks(db, ME)).some((t) => t.title === "Việc riêng của bạn")).toBe(false);
    expect((await listHabits(db, ME)).some((h) => h.name === "Thói quen của bạn")).toBe(false);
    expect((await listRecentDailyLogs(db, ME, 50)).some((l) => l.done === "bí mật")).toBe(false);
    expect((await listReflections(db, ME)).some((r) => r.wentWell === "bí mật")).toBe(false);
    expect((await listTasks(db, other)).map((t) => t.title)).toEqual(["Việc riêng của bạn"]);
  });

  it("biết id của người khác cũng không sửa / tích / dời / xóa được", async () => {
    const [theirs] = await listTasks(db, other);
    await expect(markTaskDone(db, ME, theirs.id)).rejects.toThrow();
    await expect(setTaskPlannedOn(db, ME, theirs.id, "2026-11-01")).rejects.toThrow();
    await expect(updateTask(db, ME, theirs.id, update("Chiếm đoạt"))).rejects.toThrow();
    expect((await listTasks(db, other))[0]).toMatchObject({ title: "Việc riêng của bạn", status: "Chưa làm", plannedOn: null });

    const [goal] = await listGoals(db, other);
    await expect(updateGoal(db, ME, goal.id, { title: "Chiếm đoạt" })).rejects.toThrow();
    await trashGoal(db, ME, goal.id, true); // không lỗi nhưng không có tác dụng
    expect((await listGoals(db, other)).map((g) => g.title)).toEqual(["Của bạn"]);

    const [habit] = await listHabits(db, other);
    await setHabitEnd(db, ME, habit.id, "2026-10-01");
    expect((await listHabits(db, other))[0].to).toBeNull();
  });

  it("không gắn thói quen của người khác vào mục tiêu của mình", async () => {
    const [habit] = await listHabits(db, other);
    const g = await createGoal(db, ME, "month", "2026-10-01", "Mục tiêu tháng", "Thường");
    await expect(updateGoal(db, ME, g, { habitId: habit.id })).rejects.toThrow();
  });
});

describe("thói quen và Daily Log", () => {
  it("ghi toàn bộ thói quen trong ngày; đọc ra tên; ngày chỉ có thói quen vẫn có Daily Log", async () => {
    await createHabit(db, ME, "Chạy bộ", "2026-10-01", 1);
    await createHabit(db, ME, "Đọc sách", "2026-10-01", 2);
    await setDayHabits(db, ME, "2026-10-27", ["Đọc sách", "Chạy bộ"]);
    expect((await listRecentDailyLogs(db, ME, 5))[0]).toMatchObject({ date: "2026-10-27", habits: ["Chạy bộ", "Đọc sách"], done: "" });

    await setDayHabits(db, ME, "2026-10-27", ["Đọc sách"]); // ghi đè, không cộng dồn
    expect((await listRecentDailyLogs(db, ME, 5))[0].habits).toEqual(["Đọc sách"]);
    await setDayHabits(db, ME, "2026-10-27", []);
    expect((await listRecentDailyLogs(db, ME, 5))[0].habits).toEqual([]);
  });

  it("lưu Daily Log: lần đầu tạo, lần sau cập nhật, không đụng thói quen; đọc theo khoảng ngày", async () => {
    await setDayHabits(db, ME, "2026-10-28", ["Chạy bộ"]);
    expect(await saveDailyLog(db, ME, "2026-10-28", { done: "A", dropped: "B", learned: "C", exercised: null })).toBe("updated");
    expect(await saveDailyLog(db, ME, "2026-10-29", { done: "D", dropped: "", learned: "", exercised: null })).toBe("created");
    const logs = await listDailyLogsBetween(db, ME, "2026-10-28", "2026-10-29");
    expect(logs.map((l) => [l.date, l.done, l.habits])).toEqual([
      ["2026-10-28", "A", ["Chạy bộ"]],
      ["2026-10-29", "D", []],
    ]);
    expect(await listDailyLogsBetween(db, ME, "2026-10-30", "2026-10-31")).toEqual([]);
  });

  it("thói quen: thêm theo thứ tự, ngừng theo dõi giữ lịch sử", async () => {
    const [run] = (await listHabits(db, ME)).filter((h) => h.name === "Chạy bộ");
    await setHabitEnd(db, ME, run.id, "2026-10-01");
    const after = (await listHabits(db, ME)).find((h) => h.id === run.id)!;
    expect(after).toMatchObject({ from: "2026-10-01", to: "2026-10-01", order: 1 });
    expect((await listDailyLogsBetween(db, ME, "2026-10-28", "2026-10-28"))[0].habits).toEqual(["Chạy bộ"]);
  });
});

describe("goals và nhìn lại", () => {
  it("xóa mềm + hoàn tác; sửa; gắn thói quen và ngưỡng", async () => {
    const [habit] = await listHabits(db, ME);
    const id = await createGoal(db, ME, "month", "2026-10-01", "Chạy 20 buổi", "Ưu tiên");
    await updateGoal(db, ME, id, { title: "Chạy 25 buổi", done: true, habitId: habit.id, threshold: 80 });
    expect((await listGoals(db, ME)).find((g) => g.id === id)).toMatchObject({ title: "Chạy 25 buổi", done: true, habitId: habit.id, threshold: 80, type: "Ưu tiên", level: "month", start: "2026-10-01" });

    await trashGoal(db, ME, id, true);
    expect((await listGoals(db, ME)).some((g) => g.id === id)).toBe(false);
    await expect(updateGoal(db, ME, id, { title: "x" })).rejects.toThrow(); // đã xóa
    await trashGoal(db, ME, id, false);
    expect((await listGoals(db, ME)).some((g) => g.id === id)).toBe(true);
  });

  it("nhìn lại: mỗi (cấp, kỳ) một bản ghi", async () => {
    const f = { wentWell: "a", lesson: "b", grateful: "c", nextFocus: "d", motto: "" };
    expect(await saveReflection(db, ME, "month", "2026-10-01", f)).toBe("created");
    expect(await saveReflection(db, ME, "month", "2026-10-01", { ...f, motto: "Cứ đi" })).toBe("updated");
    const mine = (await listReflections(db, ME)).filter((r) => r.level === "month");
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ start: "2026-10-01", wentWell: "a", motto: "Cứ đi" });
  });

  it("ý tưởng ghi được", async () => {
    await expect(createIdea(db, ME, "Làm app điểm danh")).resolves.toBeUndefined();
  });
});
