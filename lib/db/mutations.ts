// Ghi dữ liệu (thay lib/notion/mutations.ts). Mọi hàm nhận `userId` và mọi UPDATE/DELETE đều kèm
// `user_id = ?` — đoán được id của người khác cũng không sửa được (SPEC-v1.0 mục 6).

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "./client";
import { dailyLogs, goals, goalTasks, habitDays, habits, ideas, projects, reflections, tasks } from "./schema";
import type { GoalType } from "@/lib/goals";
import { LEGACY_EXERCISE } from "@/lib/habits";
import type { Level } from "@/lib/period";
import type { ReflectionFields } from "@/lib/reflections";
import { todayVN } from "@/lib/date";
import type { DailyLogInput } from "@/lib/quick-capture";
import type { TaskInput, TaskUpdate } from "@/lib/task-form";

/** id dự án theo tên (của đúng user); tên rỗng / không có → null. */
async function projectId(db: Db, userId: string, name: string | null): Promise<string | null> {
  if (!name) return null;
  const [row] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.userId, userId), eq(projects.name, name)));
  return row?.id ?? null;
}

const ownTask = (userId: string, id: string) => and(eq(tasks.id, id), eq(tasks.userId, userId));

/** Tích xong task: Trạng thái = Xong, Ngày xong = hôm nay (SPEC-v0.3 mục 6). */
export async function markTaskDone(db: Db, userId: string, id: string): Promise<void> {
  const res = await db.update(tasks).set({ status: "Xong", doneOn: todayVN() }).where(ownTask(userId, id)).returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");
}

/** Bỏ tích xong (SPEC-v1.0, 07/11/2026): về Chưa làm, xoá Ngày xong; liên kết mục tiêu giữ nguyên. */
export async function reopenTask(db: Db, userId: string, id: string): Promise<void> {
  const res = await db.update(tasks).set({ status: "Chưa làm", doneOn: null }).where(ownTask(userId, id)).returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");
}

/** Xóa hẳn task (SPEC-v1.0, 05/11/2026); goal_tasks tự xóa theo (ON DELETE CASCADE). */
export async function deleteTask(db: Db, userId: string, id: string): Promise<void> {
  const res = await db.delete(tasks).where(ownTask(userId, id)).returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");
}

/** Đặt / bỏ Ngày làm (SPEC-v0.5). */
export async function setTaskPlannedOn(db: Db, userId: string, id: string, day: string | null): Promise<void> {
  const res = await db.update(tasks).set({ plannedOn: day }).where(ownTask(userId, id)).returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");
}

export async function createTask(db: Db, userId: string, input: TaskInput): Promise<void> {
  await db.insert(tasks).values({
    userId,
    title: input.title,
    projectId: await projectId(db, userId, input.project),
    priority: input.priority,
    deadline: input.deadline,
    plannedOn: input.plannedOn,
  });
}

/** Form sửa chỉ cho Chưa làm / Đang làm → task mở lại thì bỏ Ngày xong (SPEC-v0.3 mục 6). `goalId` undefined = không đụng tới. */
export async function updateTask(db: Db, userId: string, id: string, input: TaskUpdate): Promise<void> {
  const res = await db
    .update(tasks)
    .set({
      title: input.title,
      projectId: await projectId(db, userId, input.project),
      priority: input.priority,
      deadline: input.deadline,
      plannedOn: input.plannedOn,
      status: input.status,
      doneOn: null,
      note: input.note,
    })
    .where(ownTask(userId, id))
    .returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");

  if (input.goalId !== undefined) {
    await db.delete(goalTasks).where(eq(goalTasks.taskId, id));
    if (input.goalId) {
      const [goal] = await db.select({ id: goals.id }).from(goals).where(and(eq(goals.id, input.goalId), eq(goals.userId, userId)));
      if (goal) await db.insert(goalTasks).values({ goalId: goal.id, taskId: id });
    }
  }
}

// ---------- Daily Log, thói quen, ý tưởng ----------

async function upsertDay(db: Db, userId: string, day: string, values: Partial<typeof dailyLogs.$inferInsert>): Promise<"created" | "updated"> {
  const [existing] = await db.select({ id: dailyLogs.id }).from(dailyLogs).where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.day, day)));
  if (existing) {
    if (Object.keys(values).length) await db.update(dailyLogs).set(values).where(eq(dailyLogs.id, existing.id));
    return "updated";
  }
  await db.insert(dailyLogs).values({ ...values, userId, day });
  return "created";
}

/** Mỗi ngày 1 bản ghi (SPEC-v0.2 4.1). Ô "Tập thể dục" cũ (nếu form có) bật/tắt cột `exercised`. */
export async function saveDailyLog(db: Db, userId: string, day: string, input: DailyLogInput): Promise<"created" | "updated"> {
  return upsertDay(db, userId, day, {
    done: input.done,
    dropped: input.dropped,
    learned: input.learned,
    ...(input.exercised !== null && { exercised: input.exercised }),
  });
}

/** Ghi **toàn bộ** thói quen đã làm của `day` (không bật/tắt lẻ → hai lần bấm nhanh không ghi đè nhau sai). */
export async function setDayHabits(db: Db, userId: string, day: string, names: string[]): Promise<void> {
  await upsertDay(db, userId, day, {}); // ngày có thói quen cũng là một ngày có Daily Log
  const mine = await db.select({ id: habits.id, name: habits.name }).from(habits).where(eq(habits.userId, userId));
  const mineIds = mine.map((h) => h.id);
  if (mineIds.length) await db.delete(habitDays).where(and(eq(habitDays.day, day), inArray(habitDays.habitId, mineIds)));
  const chosen = mine.filter((h) => names.includes(h.name));
  if (chosen.length) await db.insert(habitDays).values(chosen.map((h) => ({ habitId: h.id, day })));
  // Checkbox "Tập thể dục" cũ không còn nguồn thứ hai: thói quen cùng tên là sự thật duy nhất
  if (mine.some((h) => h.name === LEGACY_EXERCISE)) await db.update(dailyLogs).set({ exercised: false }).where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.day, day)));
}

/** Thêm thói quen, theo dõi từ tháng `from` (YYYY-MM-01). */
export async function createHabit(db: Db, userId: string, name: string, from: string, order: number): Promise<void> {
  await db.insert(habits).values({ userId, name, fromMonth: from, sort: order });
}

export async function setHabitOrder(db: Db, userId: string, id: string, order: number): Promise<void> {
  await db.update(habits).set({ sort: order }).where(and(eq(habits.id, id), eq(habits.userId, userId)));
}

/** Ngừng theo dõi sau tháng `to` (YYYY-MM-01); null = theo dõi lại. Lịch sử giữ nguyên. */
export async function setHabitEnd(db: Db, userId: string, id: string, to: string | null): Promise<void> {
  await db.update(habits).set({ toMonth: to }).where(and(eq(habits.id, id), eq(habits.userId, userId)));
}

export async function createIdea(db: Db, userId: string, idea: string): Promise<void> {
  await db.insert(ideas).values({ userId, text: idea });
}

// ---------- Goals ----------

export async function createGoal(db: Db, userId: string, level: Level, start: string, title: string, type: GoalType): Promise<string> {
  const [row] = await db.insert(goals).values({ userId, level, start, title, type }).returning({ id: goals.id });
  return row.id;
}

export type GoalPatch = { title?: string; type?: GoalType; done?: boolean; habitId?: string | null; threshold?: number | null };

export async function updateGoal(db: Db, userId: string, id: string, patch: GoalPatch): Promise<void> {
  if (patch.habitId) {
    const [h] = await db.select({ id: habits.id }).from(habits).where(and(eq(habits.id, patch.habitId), eq(habits.userId, userId)));
    if (!h) throw new Error("Thói quen không hợp lệ");
  }
  const res = await db
    .update(goals)
    .set({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.type !== undefined && { type: patch.type }),
      ...(patch.done !== undefined && { done: patch.done }),
      ...(patch.habitId !== undefined && { habitId: patch.habitId }),
      ...(patch.threshold !== undefined && { threshold: patch.threshold }),
    })
    .where(and(eq(goals.id, id), eq(goals.userId, userId), isNull(goals.deletedAt)))
    .returning({ id: goals.id });
  if (!res.length) throw new Error("Không tìm thấy mục tiêu");
}

/** Xóa mềm; `trashed: false` để hoàn tác. */
export async function trashGoal(db: Db, userId: string, id: string, trashed: boolean): Promise<void> {
  await db
    .update(goals)
    .set({ deletedAt: trashed ? sql`now()` : null })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
}

// ---------- Reflections ----------

/** Mỗi (cấp, kỳ) 1 bản ghi: đã có → cập nhật; chưa có → tạo. */
export async function saveReflection(db: Db, userId: string, level: Level, start: string, fields: ReflectionFields): Promise<"created" | "updated"> {
  const [existing] = await db
    .select({ id: reflections.id })
    .from(reflections)
    .where(and(eq(reflections.userId, userId), eq(reflections.level, level), eq(reflections.start, start)));
  if (existing) {
    await db.update(reflections).set(fields).where(eq(reflections.id, existing.id));
    return "updated";
  }
  await db.insert(reflections).values({ userId, level, start, ...fields });
  return "created";
}

/**
 * Chuyển mục tiêu chưa xong sang kỳ sau (SPEC-v1.0, Goal đợt 2): bản sao giữ loại, không sao thói quen / việc gắn;
 * bỏ qua tên đã có ở kỳ sau. Trả về id các mục tiêu đã tạo (để hoàn tác bằng xoá mềm).
 */
export async function carryOverGoals(db: Db, userId: string, level: Level, from: string, to: string): Promise<string[]> {
  const rows = await db
    .select({ title: goals.title, type: goals.type, done: goals.done, start: goals.start })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.level, level), isNull(goals.deletedAt), inArray(goals.start, [from, to])));
  const existing = new Set(rows.filter((g) => g.start === to).map((g) => g.title.trim().toLowerCase()));
  const todo = rows.filter((g) => g.start === from && !g.done && g.title.trim() && !existing.has(g.title.trim().toLowerCase()));
  if (!todo.length) return [];
  const created = await db
    .insert(goals)
    .values(todo.map((g) => ({ userId, level, start: to, title: g.title, type: g.type })))
    .returning({ id: goals.id });
  return created.map((c) => c.id);
}

/**
 * Gắn việc vào mục tiêu từ dòng mục tiêu (SPEC-v1.0, Goal đợt 3): mỗi việc một mục tiêu → thay liên kết cũ;
 * `goalId` null = bỏ gắn. Việc và mục tiêu đều phải của người dùng.
 */
export async function setTaskGoal(db: Db, userId: string, taskId: string, goalId: string | null): Promise<void> {
  const [t] = await db.select({ id: tasks.id }).from(tasks).where(ownTask(userId, taskId));
  if (!t) throw new Error("Không tìm thấy task");
  if (goalId) {
    const [g] = await db.select({ id: goals.id }).from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId), isNull(goals.deletedAt)));
    if (!g) throw new Error("Không tìm thấy mục tiêu");
  }
  await db.delete(goalTasks).where(eq(goalTasks.taskId, taskId));
  if (goalId) await db.insert(goalTasks).values({ goalId, taskId });
}
