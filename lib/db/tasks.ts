// Việc (Tasks): đọc + ghi. Mọi hàm nhận `userId` và mọi truy vấn đều lọc theo nó (SPEC.md mục 3).

import { and, asc, eq, isNull, inArray } from "drizzle-orm";
import type { Db } from "./client";
import { goals, goalTasks, projects, tasks } from "./schema";
import type { Task } from "@/lib/types";
import { todayVN } from "@/lib/date";
import type { TaskInput, TaskUpdate } from "@/lib/task-form";

export async function listTasks(db: Db, userId: string): Promise<Task[]> {
  const [rows, links] = await Promise.all([
    db
      .select({ t: tasks, project: projects.name })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.createdAt)),
    db
      .select({ goalId: goalTasks.goalId, taskId: goalTasks.taskId })
      .from(goalTasks)
      .innerJoin(goals, eq(goalTasks.goalId, goals.id))
      .where(and(eq(goals.userId, userId), isNull(goals.deletedAt))),
  ]);
  const goalsOf = new Map<string, string[]>();
  for (const l of links) goalsOf.set(l.taskId, [...(goalsOf.get(l.taskId) ?? []), l.goalId]);
  return rows.map(({ t, project }) => ({
    id: t.id,
    title: t.title,
    project,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline,
    plannedOn: t.plannedOn,
    note: t.note,
    doneOn: t.doneOn,
    createdTime: t.createdAt.toISOString(),
    goalIds: goalsOf.get(t.id) ?? [],
  }));
}

/** id dự án theo tên (của đúng user); tên rỗng / không có → null. */
async function projectId(db: Db, userId: string, name: string | null): Promise<string | null> {
  if (!name) return null;
  const [row] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.userId, userId), eq(projects.name, name)));
  return row?.id ?? null;
}

export const ownTask = (userId: string, id: string) => and(eq(tasks.id, id), eq(tasks.userId, userId));

/** Tích xong task: Trạng thái = Xong, Ngày xong = hôm nay (SPEC.md mục 3). */
export async function markTaskDone(db: Db, userId: string, id: string): Promise<void> {
  const res = await db.update(tasks).set({ status: "Xong", doneOn: todayVN() }).where(ownTask(userId, id)).returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");
}

/**
 * Bỏ tích xong (SPEC.md mục 3, 07/11/2026): về Chưa làm (hoặc trạng thái trước khi tích, khi Hoàn tác), xoá Ngày xong;
 * liên kết mục tiêu giữ nguyên.
 */
export async function reopenTask(db: Db, userId: string, id: string, status: "Chưa làm" | "Đang làm" = "Chưa làm"): Promise<void> {
  const res = await db.update(tasks).set({ status, doneOn: null }).where(ownTask(userId, id)).returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");
}

/** Xóa hẳn task (SPEC.md mục 3, 05/11/2026); goal_tasks tự xóa theo (ON DELETE CASCADE). */
export async function deleteTask(db: Db, userId: string, id: string): Promise<void> {
  const res = await db.delete(tasks).where(ownTask(userId, id)).returning({ id: tasks.id });
  if (!res.length) throw new Error("Không tìm thấy task");
}

/** Đặt / bỏ Ngày làm (SPEC.md mục 3). */
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

/** Form sửa chỉ cho Chưa làm / Đang làm → task mở lại thì bỏ Ngày xong (SPEC.md mục 3). `goalId` undefined = không đụng tới. */
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

/** Ảnh chụp một task để hoàn tác xoá (SPEC.md mục 3): chèn lại **đúng id**, giữ cả liên kết mục tiêu. */
export type TaskSnapshot = {
  id: string;
  title: string;
  project: string | null;
  status: "Chưa làm" | "Đang làm" | "Xong" | null;
  priority: "Cao" | "Vừa" | "Thấp" | null;
  deadline: string | null;
  plannedOn: string | null;
  doneOn: string | null;
  note: string;
  createdTime: string;
  goalIds: string[];
};

/** Hoàn tác xoá: chèn lại task với id cũ. Không ghi đè nếu id đang tồn tại; mục tiêu không còn / của người khác thì bỏ qua. */
export async function restoreTask(db: Db, userId: string, s: TaskSnapshot): Promise<void> {
  const [exists] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, s.id));
  if (exists) throw new Error("Task đã tồn tại");
  await db.insert(tasks).values({
    id: s.id,
    userId,
    title: s.title,
    projectId: await projectId(db, userId, s.project),
    status: s.status ?? "Chưa làm",
    priority: s.priority,
    deadline: s.deadline,
    plannedOn: s.plannedOn,
    doneOn: s.doneOn,
    note: s.note,
    createdAt: new Date(s.createdTime),
  });
  if (s.goalIds.length) {
    const mine = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.userId, userId), isNull(goals.deletedAt), inArray(goals.id, s.goalIds)));
    if (mine.length) await db.insert(goalTasks).values(mine.map((g) => ({ goalId: g.id, taskId: s.id })));
  }
}

// ---------- Hồ sơ (Cài đặt, SPEC.md mục 3) ----------
