// Dự án của từng người (Cài đặt, SPEC.md mục 4B): đọc + ghi, lọc theo `userId`.

import { and, asc, count, eq, sql } from "drizzle-orm";
import type { Db } from "./client";
import { projects, tasks } from "./schema";

export async function listProjectNames(db: Db, userId: string): Promise<string[]> {
  const rows = await db.select({ name: projects.name }).from(projects).where(eq(projects.userId, userId)).orderBy(asc(projects.sort), asc(projects.name));
  return rows.map((r) => r.name);
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

export const MAX_PROJECT_NAME = 40;

async function nameTaken(db: Db, userId: string, name: string, exceptId?: string): Promise<boolean> {
  const rows = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.userId, userId), eq(projects.name, name)));
  return rows.some((r) => r.id !== exceptId);
}

export async function createProject(db: Db, userId: string, name: string): Promise<void> {
  if (await nameTaken(db, userId, name)) throw new Error("Đã có dự án tên này");
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${projects.sort}), -1) + 1` })
    .from(projects)
    .where(eq(projects.userId, userId));
  await db.insert(projects).values({ userId, name, sort: Number(next) });
}

/** Đổi tên: việc gắn dự án theo id nên tự theo tên mới. */
export async function renameProject(db: Db, userId: string, id: string, name: string): Promise<void> {
  if (await nameTaken(db, userId, name, id)) throw new Error("Đã có dự án tên này");
  const res = await db
    .update(projects)
    .set({ name })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });
  if (!res.length) throw new Error("Không tìm thấy dự án");
}

/** Chỉ xoá khi không còn việc nào gắn (tránh âm thầm đẩy việc về "Không có dự án"). */
export async function deleteProject(db: Db, userId: string, id: string): Promise<void> {
  const [own] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
  if (!own) throw new Error("Không tìm thấy dự án");
  const [used] = await db.select({ n: sql<number>`count(*)` }).from(tasks).where(eq(tasks.projectId, id));
  if (Number(used.n) > 0) throw new Error("Dự án còn việc");
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ---------- Xoá tài khoản (SPEC.md mục 3C) ----------
