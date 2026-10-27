import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "./client";
import { dailyLogs, DEFAULT_USER_ID, goals, goalTasks, habitDays, habits, ideas, projects, reflections, tasks, users } from "./schema";
import { createTestDb } from "./test-db";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
}, 30_000);
afterAll(() => close());

describe("migration", () => {
  it("tạo sẵn user mặc định và dự án Chung", async () => {
    const [user] = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID));
    expect(user?.name).toBe("Trung");
    expect(user?.googleSub).toBeNull();
    const rows = await db.select().from(projects).where(eq(projects.userId, DEFAULT_USER_ID));
    expect(rows.map((p) => p.name)).toEqual(["Chung"]);
  });
});

describe("kiểu dữ liệu", () => {
  it("ngày đọc ra YYYY-MM-DD, mặc định trạng thái Chưa làm", async () => {
    const [t] = await db.insert(tasks).values({ userId: DEFAULT_USER_ID, title: "Viết chương 3", deadline: "2026-11-08", plannedOn: "2026-10-28" }).returning();
    expect(t).toMatchObject({ status: "Chưa làm", deadline: "2026-11-08", plannedOn: "2026-10-28", priority: null, note: "" });
  });

  it("từ chối giá trị ngoài enum", async () => {
    // @ts-expect-error — cố ý sai giá trị
    await expect(db.insert(tasks).values({ userId: DEFAULT_USER_ID, status: "Bỏ" })).rejects.toThrow();
  });

  it("mỗi user chỉ một Daily Log mỗi ngày", async () => {
    await db.insert(dailyLogs).values({ userId: DEFAULT_USER_ID, day: "2026-10-27", done: "A" });
    await expect(db.insert(dailyLogs).values({ userId: DEFAULT_USER_ID, day: "2026-10-27" })).rejects.toThrow();
  });
});

describe("xóa", () => {
  it("xóa task thì gỡ liên kết goal, goal còn", async () => {
    const [t] = await db.insert(tasks).values({ userId: DEFAULT_USER_ID, title: "T" }).returning();
    const [g] = await db.insert(goals).values({ userId: DEFAULT_USER_ID, title: "G", level: "week", start: "2026-10-26" }).returning();
    await db.insert(goalTasks).values({ goalId: g.id, taskId: t.id });
    await db.delete(tasks).where(eq(tasks.id, t.id));
    expect(await db.select().from(goalTasks).where(eq(goalTasks.goalId, g.id))).toEqual([]);
    expect(await db.select().from(goals).where(eq(goals.id, g.id))).toHaveLength(1);
  });

  it("xóa user xóa sạch dữ liệu của user đó, không đụng user khác", async () => {
    const [a] = await db.insert(users).values({ name: "A", email: "a@example.com" }).returning();
    const u = a.id;
    const [p] = await db.insert(projects).values({ userId: u, name: "Đồ án" }).returning();
    const [t] = await db.insert(tasks).values({ userId: u, title: "T", projectId: p.id }).returning();
    const [h] = await db.insert(habits).values({ userId: u, name: "Chạy", fromMonth: "2026-10-01" }).returning();
    await db.insert(habitDays).values({ habitId: h.id, day: "2026-10-27" });
    const [g] = await db.insert(goals).values({ userId: u, title: "G", level: "month", start: "2026-10-01", habitId: h.id, threshold: 80 }).returning();
    await db.insert(goalTasks).values({ goalId: g.id, taskId: t.id });
    await db.insert(dailyLogs).values({ userId: u, day: "2026-10-27" });
    await db.insert(reflections).values({ userId: u, level: "week", start: "2026-10-26", lesson: "x" });
    await db.insert(ideas).values({ userId: u, text: "ý tưởng" });

    const before = await db.select().from(tasks).where(eq(tasks.userId, DEFAULT_USER_ID));
    await db.delete(users).where(eq(users.id, u));

    for (const table of [projects, tasks, habits, goals, dailyLogs, reflections, ideas]) {
      expect(await db.select().from(table).where(eq(table.userId, u))).toEqual([]);
    }
    expect(await db.select().from(habitDays).where(eq(habitDays.habitId, h.id))).toEqual([]);
    expect(await db.select().from(goalTasks).where(eq(goalTasks.goalId, g.id))).toEqual([]);
    expect(await db.select().from(tasks).where(eq(tasks.userId, DEFAULT_USER_ID))).toEqual(before);
  });
});
