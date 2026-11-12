// Đọc dữ liệu (thay lib/notion/queries.ts). Mọi hàm nhận `userId` làm tham số và luôn lọc theo nó (SPEC-v1.0 mục 6);
// trả đúng kiểu mà giao diện đã dùng từ thời Notion nên trang không phải đổi.

import { and, asc, count, desc, eq, gte, isNull, lte, inArray } from "drizzle-orm";
import type { Db } from "./client";
import { dailyLogs, goals, goalTasks, habitDays, habits, projects, reflections, tasks, users } from "./schema";
import type { Goal } from "@/lib/goals";
import type { DailyLog, Habit, Task } from "@/lib/types";
import type { Reflection } from "@/lib/reflections";

export async function listProjectNames(db: Db, userId: string): Promise<string[]> {
  const rows = await db.select({ name: projects.name }).from(projects).where(eq(projects.userId, userId)).orderBy(asc(projects.sort), asc(projects.name));
  return rows.map((r) => r.name);
}

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

export async function listHabits(db: Db, userId: string): Promise<Habit[]> {
  const rows = await db.select().from(habits).where(eq(habits.userId, userId)).orderBy(asc(habits.sort), asc(habits.name));
  return rows.map((h) => ({ id: h.id, name: h.name, from: h.fromMonth, to: h.toMonth, order: h.sort }));
}

/** Daily Log kèm tên các thói quen đã làm (từ habit_days) — cùng dạng `DailyLog` như thời Notion. */
async function withHabits(db: Db, userId: string, logs: (typeof dailyLogs.$inferSelect)[]): Promise<DailyLog[]> {
  if (!logs.length) return [];
  const days = logs.map((l) => l.day);
  const rows = await db
    .select({ day: habitDays.day, name: habits.name })
    .from(habitDays)
    .innerJoin(habits, eq(habitDays.habitId, habits.id))
    .where(and(eq(habits.userId, userId), inArray(habitDays.day, days)))
    .orderBy(asc(habits.sort), asc(habits.name));
  const namesOf = new Map<string, string[]>();
  for (const r of rows) namesOf.set(r.day, [...(namesOf.get(r.day) ?? []), r.name]);
  return logs.map((l) => ({
    id: l.id,
    title: l.day,
    date: l.day,
    done: l.done,
    dropped: l.dropped,
    learned: l.learned,
    tomorrowTop3: "", // đã thay bằng "Ngày mai làm" (Ngày làm của task), SPEC-v0.5 10.2a
    exercised: l.exercised,
    habits: namesOf.get(l.day) ?? [],
  }));
}

/** `limit` ngày gần nhất có Daily Log (mới trước). */
export async function listRecentDailyLogs(db: Db, userId: string, limit = 7): Promise<DailyLog[]> {
  const rows = await db.select().from(dailyLogs).where(eq(dailyLogs.userId, userId)).orderBy(desc(dailyLogs.day)).limit(limit);
  return withHabits(db, userId, rows);
}

/** Từ `start` đến `end`, gồm cả hai đầu. */
export async function listDailyLogsBetween(db: Db, userId: string, start: string, end: string): Promise<DailyLog[]> {
  const rows = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), gte(dailyLogs.day, start), lte(dailyLogs.day, end)))
    .orderBy(asc(dailyLogs.day));
  return withHabits(db, userId, rows);
}

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
  }));
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

export type Profile = { name: string; email: string | null; targetDate: string | null; targetLabel: string };

/** Hồ sơ người đang đăng nhập (Cài đặt, lời chào, đếm ngược). */
export async function getProfileRow(db: Db, userId: string): Promise<Profile | null> {
  const [row] = await db
    .select({ name: users.name, email: users.email, targetDate: users.targetDate, targetLabel: users.targetLabel })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

export type ProjectRow = { id: string; name: string; tasks: number };

/** Dự án của người dùng kèm số việc đang gắn (Cài đặt → xoá chỉ khi 0 việc). */
export async function listProjectsWithCounts(db: Db, userId: string): Promise<ProjectRow[]> {
  const rows = await db
    .select({ id: projects.id, name: projects.name, tasks: count(tasks.id) })
    .from(projects)
    .leftJoin(tasks, eq(tasks.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .groupBy(projects.id, projects.name, projects.sort)
    .orderBy(asc(projects.sort), asc(projects.name));
  return rows.map((r) => ({ id: r.id, name: r.name, tasks: Number(r.tasks) }));
}
