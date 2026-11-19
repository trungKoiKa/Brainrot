// Mục tiêu, gắn việc vào mục tiêu và Nhìn lại (Goal, SPEC.md mục 5.3): đọc + ghi, lọc theo `userId`.

import { and, asc, eq, isNull, inArray, sql } from "drizzle-orm";
import type { Db } from "./client";
import { goals, goalTasks, habits, reflections, tasks } from "./schema";
import type { Goal, GoalType } from "@/lib/goals";
import type { Reflection, ReflectionFields } from "@/lib/reflections";
import { monthOf, monthsOfWeek, type Level } from "@/lib/period";
import { ownTask } from "./tasks";

export async function listGoals(db: Db, userId: string): Promise<Goal[]> {
  const [rows, links] = await Promise.all([
    db.select().from(goals).where(and(eq(goals.userId, userId), isNull(goals.deletedAt))).orderBy(asc(goals.createdAt)),
    db
      .select({ goalId: goalTasks.goalId, taskId: goalTasks.taskId })
      .from(goalTasks)
      .innerJoin(goals, eq(goalTasks.goalId, goals.id))
      .where(eq(goals.userId, userId)),
  ]);
  const tasksOf = new Map<string, string[]>();
  for (const l of links) tasksOf.set(l.goalId, [...(tasksOf.get(l.goalId) ?? []), l.taskId]);
  return rows.map((g) => ({
    id: g.id,
    title: g.title,
    level: g.level,
    start: g.start,
    type: g.type,
    done: g.done,
    habitId: g.habitId,
    threshold: g.threshold,
    taskIds: tasksOf.get(g.id) ?? [],
    parentId: g.parentId,
  }));
}

export const BAD_PARENT = "Mục tiêu tháng không hợp lệ cho tuần này.";


/** Mục tiêu tháng làm cha được cho tuần `monday` (SPEC.md mục 12.2): của đúng user, chưa xoá, tháng chạm tuần. */
async function checkParent(db: Db, userId: string, monday: string, parentId: string): Promise<void> {
  const [p] = await db
    .select({ level: goals.level, start: goals.start })
    .from(goals)
    .where(and(eq(goals.id, parentId), eq(goals.userId, userId), isNull(goals.deletedAt)));
  if (!p || p.level !== "month" || !monthsOfWeek(monday).includes(monthOf(p.start))) throw new Error(BAD_PARENT);
}

/** Gắn / bỏ mục tiêu tháng cho một mục tiêu tuần (SPEC.md mục 12.2). `parentId` null = bỏ. */
export async function setGoalParent(db: Db, userId: string, id: string, parentId: string | null): Promise<void> {
  const [g] = await db
    .select({ level: goals.level, start: goals.start })
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId), isNull(goals.deletedAt)));
  if (!g || g.level !== "week") throw new Error("Không tìm thấy mục tiêu");
  if (parentId) await checkParent(db, userId, g.start, parentId);
  await db.update(goals).set({ parentId }).where(and(eq(goals.id, id), eq(goals.userId, userId)));
}

export async function listReflections(db: Db, userId: string): Promise<Reflection[]> {
  const rows = await db.select().from(reflections).where(eq(reflections.userId, userId));
  return rows.map((r) => ({
    id: r.id,
    level: r.level,
    start: r.start,
    wentWell: r.wentWell,
    lesson: r.lesson,
    grateful: r.grateful,
    nextFocus: r.nextFocus,
    motto: r.motto,
  }));
}

/** Thêm mục tiêu; `parentId` (chỉ cấp tuần) = mục tiêu tháng nó thuộc về (SPEC.md mục 12.2). */
export async function createGoal(
  db: Db,
  userId: string,
  level: Level,
  start: string,
  title: string,
  type: GoalType,
  parentId: string | null = null,
): Promise<string> {
  if (parentId) {
    if (level !== "week") throw new Error(BAD_PARENT);
    await checkParent(db, userId, start, parentId);
  }
  const [row] = await db.insert(goals).values({ userId, level, start, title, type, parentId }).returning({ id: goals.id });
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
 * Chuyển mục tiêu chưa xong sang kỳ sau (SPEC.md mục 3): bản sao giữ loại, không sao thói quen / việc gắn;
 * bỏ qua tên đã có ở kỳ sau. Trả về id các mục tiêu đã tạo (để hoàn tác bằng xoá mềm).
 * `onlyIds`: chỉ chuyển đúng các mục tiêu màn hình đang coi là chưa xong (kể cả "tự xong" theo thói quen/việc,
 * thứ chỉ tính được ở lớp trên) → số trên nút khớp số đã chuyển (rà soát 11/2026, A2 lỗi 2).
 */
export async function carryOverGoals(db: Db, userId: string, level: Level, from: string, to: string, onlyIds?: readonly string[]): Promise<string[]> {
  const rows = await db
    .select({ id: goals.id, title: goals.title, type: goals.type, done: goals.done, start: goals.start, parentId: goals.parentId })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.level, level), isNull(goals.deletedAt), inArray(goals.start, [from, to])));
  const existing = new Set(rows.filter((g) => g.start === to).map((g) => g.title.trim().toLowerCase()));
  const todo = rows.filter(
    (g) => g.start === from && !g.done && g.title.trim() && !existing.has(g.title.trim().toLowerCase()) && (!onlyIds || onlyIds.includes(g.id)),
  );
  if (!todo.length) return [];
  // Tuần: giữ mục tiêu tháng cha nếu tuần sau vẫn chạm tháng của cha, không thì bỏ (SPEC.md mục 12.2)
  const parentIds = [...new Set(todo.flatMap((g) => (g.parentId ? [g.parentId] : [])))];
  const parents = parentIds.length
    ? await db
        .select({ id: goals.id, start: goals.start })
        .from(goals)
        .where(and(eq(goals.userId, userId), isNull(goals.deletedAt), inArray(goals.id, parentIds)))
    : [];
  const months = level === "week" ? monthsOfWeek(to) : [];
  const keep = new Set(parents.filter((p) => months.includes(monthOf(p.start))).map((p) => p.id));
  const created = await db
    .insert(goals)
    .values(
      todo.map((g) => ({ userId, level, start: to, title: g.title, type: g.type, parentId: g.parentId && keep.has(g.parentId) ? g.parentId : null })),
    )
    .returning({ id: goals.id });
  return created.map((c) => c.id);
}

/**
 * Gắn việc vào mục tiêu từ dòng mục tiêu (SPEC.md mục 3): mỗi việc một mục tiêu → thay liên kết cũ;
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
