import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "./client";
import {
  carryOverGoals,
  createGoal,
  createHabit,
  deleteHabit,
  restoreHabit,
  createIdea,
  createTask,
  deleteTask,
  markTaskDone,
  reopenTask,
  restoreTask,
  createProject,
  deleteUser,
  getUserEmail,
  deleteProject,
  renameProject,
  getPasswordHash,
  setPasswordHash,
  updateProfile,
  saveDailyLog,
  saveReflection,
  setDayHabits,
  setHabitEnd,
  setTaskGoal,
  setTaskPlannedOn,
  trashGoal,
  updateGoal,
  updateTask,
} from "./mutations";
import { getProfileRow, listProjectsWithCounts, listDailyLogsBetween, listGoals, listHabits, listProjectNames, listRecentDailyLogs, listReflections, listTasks } from "./queries";
import { DEFAULT_USER_ID, habits, users } from "./schema";
import { eq } from "drizzle-orm";
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
    expect(t).toMatchObject({ project: "Đồ án", priority: "Cao", status: "Chưa làm", deadline: "2026-11-08", plannedOn: "2026-10-28", doneOn: null, goalIds: [] });

    await updateTask(db, ME, t.id, update("Viết chương 3 (sửa)", { project: null, note: "ghi chú", plannedOn: null }));
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)).toMatchObject({ title: "Viết chương 3 (sửa)", project: null, status: "Đang làm", note: "ghi chú", plannedOn: null });

    await setTaskPlannedOn(db, ME, t.id, "2026-10-30");
    await markTaskDone(db, ME, t.id);
    const done = (await listTasks(db, ME)).find((x) => x.id === t.id)!;
    expect(done.status).toBe("Xong");
    expect(done.plannedOn).toBe("2026-10-30");
    expect(done.doneOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await reopenTask(db, ME, t.id); // hoàn tác tích xong (SPEC.md mục 3, 07/11/2026)
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)).toMatchObject({ status: "Chưa làm", doneOn: null, plannedOn: "2026-10-30" });
    await markTaskDone(db, ME, t.id);
    await reopenTask(db, ME, t.id, "Đang làm"); // Hoàn tác việc đang làm giữ "Đang làm" (rà soát cuối 11/2026)
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.status).toBe("Đang làm");
    await markTaskDone(db, ME, t.id);

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

describe("xóa task", () => {
  it("xóa hẳn task của mình, gỡ liên kết mục tiêu, không đụng task khác", async () => {
    await createTask(db, ME, input("Sẽ xóa"));
    await createTask(db, ME, input("Giữ lại"));
    const target = (await listTasks(db, ME)).find((t) => t.title === "Sẽ xóa")!;
    const goalId = await createGoal(db, ME, "month", "2026-11-01", "Mục tiêu có task", "Thường");
    await updateTask(db, ME, target.id, update("Sẽ xóa", { goalId }));

    await deleteTask(db, ME, target.id);
    const titles = (await listTasks(db, ME)).map((t) => t.title);
    expect(titles).not.toContain("Sẽ xóa");
    expect(titles).toContain("Giữ lại");
    expect((await listGoals(db, ME)).find((g) => g.id === goalId)?.taskIds).toEqual([]);
    await expect(deleteTask(db, ME, target.id)).rejects.toThrow();
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

  it("hoàn tác xoá: chèn lại đúng id, giữ liên kết mục tiêu, không ghi đè", async () => {
    await createTask(db, ME, input("Sắp xoá", { priority: "Cao", deadline: "2027-05-01", plannedOn: "2027-04-30" }));
    const t = (await listTasks(db, ME)).find((x) => x.title === "Sắp xoá")!;
    const g = await createGoal(db, ME, "week", "2027-04-26", "Mục tiêu giữ", "Thường");
    await updateTask(db, ME, t.id, update("Sắp xoá", { goalId: g, priority: "Cao", deadline: "2027-05-01", plannedOn: "2027-04-30" }));
    const snap = (await listTasks(db, ME)).find((x) => x.id === t.id)!;

    await deleteTask(db, ME, t.id);
    expect((await listTasks(db, ME)).some((x) => x.id === t.id)).toBe(false);
    await restoreTask(db, ME, snap);
    const back = (await listTasks(db, ME)).find((x) => x.id === t.id)!;
    expect(back).toMatchObject({ title: "Sắp xoá", priority: "Cao", deadline: "2027-05-01", plannedOn: "2027-04-30", goalIds: [g], createdTime: snap.createdTime });

    await expect(restoreTask(db, ME, snap)).rejects.toThrow(); // đã tồn tại → không ghi đè
    const foreignGoal = await createGoal(db, other, "week", "2027-04-26", "Của bạn", "Thường");
    await deleteTask(db, ME, t.id);
    await restoreTask(db, ME, { ...snap, goalIds: [foreignGoal] });
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([]); // mục tiêu của người khác bị bỏ qua
    await trashGoal(db, other, foreignGoal, true); // dọn để không ảnh hưởng các bài kiểm tra cách ly sau
  });

  it("xoá tài khoản: dữ liệu của người đó mất hết, người khác còn nguyên", async () => {
    const [{ id: temp }] = await db.insert(users).values({ name: "Tạm", email: "tam@example.com" }).returning({ id: users.id });
    await createTask(db, temp, input("Việc của tài khoản tạm"));
    await createGoal(db, temp, "week", "2027-06-07", "Mục tiêu tạm", "Thường");
    expect(await getUserEmail(db, temp)).toBe("tam@example.com");
    await deleteUser(db, temp);
    expect(await listTasks(db, temp)).toEqual([]);
    expect(await listGoals(db, temp)).toEqual([]);
    expect(await getUserEmail(db, temp)).toBeNull();
    await expect(deleteUser(db, temp)).rejects.toThrow(); // đã xoá
    expect((await listTasks(db, ME)).length).toBeGreaterThan(0); // dữ liệu người khác không bị đụng
  });

  it("hồ sơ: sửa tên / hạn / nhãn chỉ của chính mình; đổi hash mật khẩu", async () => {
    await updateProfile(db, ME, { name: "Anh Trung", targetDate: "2026-12-06", targetLabel: "nộp đồ án" });
    expect(await getProfileRow(db, ME)).toMatchObject({ name: "Anh Trung", targetDate: "2026-12-06", targetLabel: "nộp đồ án" });
    expect((await getProfileRow(db, other))?.name).not.toBe("Anh Trung"); // người khác không bị đổi

    await setPasswordHash(db, other, "scrypt$x$y");
    expect(await getPasswordHash(db, other)).toBe("scrypt$x$y");
    expect(await getPasswordHash(db, ME)).not.toBe("scrypt$x$y");
    await updateProfile(db, ME, { name: "", targetDate: null, targetLabel: "" }); // trả về như cũ cho các bài sau
  });

  it("dự án: thêm, đổi tên (việc theo tên mới), trùng tên bị chặn, chỉ xoá khi hết việc, không đụng dự án người khác", async () => {
    await createProject(db, ME, "Dự án thử");
    await expect(createProject(db, ME, "Dự án thử")).rejects.toThrow(); // trùng tên
    await createProject(db, other, "Dự án thử"); // người khác được dùng cùng tên
    let mine = (await listProjectsWithCounts(db, ME)).find((p) => p.name === "Dự án thử")!;

    await createTask(db, ME, input("Việc trong dự án", { project: "Dự án thử" }));
    await renameProject(db, ME, mine.id, "Dự án đổi tên");
    expect((await listTasks(db, ME)).find((x) => x.title === "Việc trong dự án")?.project).toBe("Dự án đổi tên");
    mine = (await listProjectsWithCounts(db, ME)).find((p) => p.name === "Dự án đổi tên")!;
    expect(mine.tasks).toBe(1);
    await expect(deleteProject(db, ME, mine.id)).rejects.toThrow(); // còn việc

    const theirs = (await listProjectsWithCounts(db, other)).find((p) => p.name === "Dự án thử")!;
    await expect(renameProject(db, ME, theirs.id, "Cướp")).rejects.toThrow();
    await expect(deleteProject(db, ME, theirs.id)).rejects.toThrow();
    expect((await listProjectsWithCounts(db, other)).some((p) => p.id === theirs.id)).toBe(true);

    const t = (await listTasks(db, ME)).find((x) => x.title === "Việc trong dự án")!;
    await deleteTask(db, ME, t.id);
    await deleteProject(db, ME, mine.id);
    expect((await listProjectsWithCounts(db, ME)).some((p) => p.id === mine.id)).toBe(false);
    await deleteProject(db, other, theirs.id); // dọn để không ảnh hưởng bài cách ly sau
  });

  it("biết id của người khác cũng không sửa / tích / dời / xóa được", async () => {
    const [theirs] = await listTasks(db, other);
    await expect(markTaskDone(db, ME, theirs.id)).rejects.toThrow();
    await expect(reopenTask(db, ME, theirs.id)).rejects.toThrow();
    await expect(setTaskPlannedOn(db, ME, theirs.id, "2026-11-01")).rejects.toThrow();
    await expect(updateTask(db, ME, theirs.id, update("Chiếm đoạt"))).rejects.toThrow();
    await expect(deleteTask(db, ME, theirs.id)).rejects.toThrow();
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

  it("chuyển mục tiêu chưa xong sang kỳ sau: bỏ qua đã xong, tên trùng, mục tiêu của người khác", async () => {
    await createGoal(db, ME, "week", "2027-03-01", "Việc dở", "Ưu tiên");
    const doneId = await createGoal(db, ME, "week", "2027-03-01", "Đã xong", "Thường");
    await updateGoal(db, ME, doneId, { done: true });
    await createGoal(db, ME, "week", "2027-03-01", "Có sẵn", "Thường");
    await createGoal(db, ME, "week", "2027-03-08", "có sẵn", "Thường");
    await createGoal(db, other, "week", "2027-03-01", "Của bạn", "Thường");

    const made = await carryOverGoals(db, ME, "week", "2027-03-01", "2027-03-08");
    expect(made).toHaveLength(1);
    const next = (await listGoals(db, ME)).filter((g) => g.start === "2027-03-08");
    expect(next.map((g) => g.title).sort()).toEqual(["Việc dở", "có sẵn"]);
    expect(next.find((g) => g.title === "Việc dở")?.type).toBe("Ưu tiên");
    expect(await carryOverGoals(db, ME, "week", "2027-03-01", "2027-03-08")).toEqual([]); // chạy lại không nhân đôi
    await trashGoal(db, ME, made[0], true); // hoàn tác = xoá mềm bản sao
    expect((await listGoals(db, ME)).some((g) => g.id === made[0])).toBe(false);
  });

  it("chuyển kỳ chỉ đúng các mục tiêu được chọn (mục tiêu tự xong không bị chuyển)", async () => {
    const keep = await createGoal(db, ME, "month", "2027-05-01", "Chưa xong thật", "Thường");
    await createGoal(db, ME, "month", "2027-05-01", "Tự xong theo thói quen", "Thường");
    const made = await carryOverGoals(db, ME, "month", "2027-05-01", "2027-06-01", [keep]);
    expect(made).toHaveLength(1);
    const next = (await listGoals(db, ME)).filter((g) => g.start === "2027-06-01").map((g) => g.title);
    expect(next).toEqual(["Chưa xong thật"]);
  });

  it("xoá hẳn thói quen rồi hoàn tác: ngày đã tích và liên kết mục tiêu quay lại; không đụng người khác", async () => {
    await createHabit(db, ME, "Thiền", "2027-01-01", 1);
    await createHabit(db, other, "Thiền của bạn", "2027-01-01", 1);
    const mine = (await listHabits(db, ME)).find((h) => h.name === "Thiền")!;
    const theirs = (await listHabits(db, other)).find((h) => h.name === "Thiền của bạn")!;
    await setDayHabits(db, ME, "2027-01-05", ["Thiền"]);
    const goalId = await createGoal(db, ME, "month", "2027-01-01", "Thiền đều", "Thường");
    await updateGoal(db, ME, goalId, { habitId: mine.id, threshold: 60 });

    expect(await deleteHabit(db, ME, theirs.id)).toBeNull(); // không xoá được của người khác
    expect((await listHabits(db, other)).some((h) => h.id === theirs.id)).toBe(true);

    const snap = (await deleteHabit(db, ME, mine.id))!;
    expect(snap.days).toEqual(["2027-01-05"]);
    expect(snap.goals).toEqual([{ id: goalId, threshold: 60 }]);
    expect((await listHabits(db, ME)).some((h) => h.id === mine.id)).toBe(false);
    expect((await listGoals(db, ME)).find((g) => g.id === goalId)?.habitId ?? null).toBeNull();

    await restoreHabit(db, other, snap); // người khác "hoàn tác" hộ → thói quen sang tài khoản họ, mục tiêu của tôi không bị gắn
    expect((await listGoals(db, ME)).find((g) => g.id === goalId)?.habitId ?? null).toBeNull();
    await db.delete(habits).where(eq(habits.id, mine.id));

    await restoreHabit(db, ME, snap);
    expect((await listHabits(db, ME)).find((h) => h.id === mine.id)?.name).toBe("Thiền");
    expect((await listGoals(db, ME)).find((g) => g.id === goalId)).toMatchObject({ habitId: mine.id, threshold: 60 });
    const logs = await listDailyLogsBetween(db, ME, "2027-01-05", "2027-01-05");
    expect(logs[0]?.habits ?? []).toContain("Thiền");
  });

  it("gắn việc từ dòng mục tiêu: thay liên kết cũ, bỏ gắn, không chạm đồ của người khác", async () => {
    await createTask(db, ME, input("Việc gắn từ mục tiêu"));
    const t = (await listTasks(db, ME)).find((x) => x.title === "Việc gắn từ mục tiêu")!;
    const g1 = await createGoal(db, ME, "week", "2027-04-05", "G1", "Thường");
    const g2 = await createGoal(db, ME, "week", "2027-04-05", "G2", "Thường");
    const foreign = await createGoal(db, other, "week", "2027-04-05", "Của bạn", "Thường");

    await setTaskGoal(db, ME, t.id, g1);
    await setTaskGoal(db, ME, t.id, g2);
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([g2]); // một việc một mục tiêu
    await expect(setTaskGoal(db, ME, t.id, foreign)).rejects.toThrow();
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([g2]); // lỗi thì giữ nguyên
    await setTaskGoal(db, ME, t.id, null);
    expect((await listTasks(db, ME)).find((x) => x.id === t.id)?.goalIds).toEqual([]);
    const [theirs] = await listTasks(db, other);
    await expect(setTaskGoal(db, ME, theirs.id, g1)).rejects.toThrow();
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
