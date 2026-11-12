import "server-only";
import { cache } from "react";
import { getDb } from "./client";
import {
  listDailyLogsBetween,
  listGoals,
  listHabits,
  listProjectNames,
  listRecentDailyLogs,
  listReflections,
  listTasks,
  getProfileRow,
  listProjectsWithCounts,
} from "./queries";
import { listFieldNames, listFieldsWithCounts, listKnowledge } from "./knowledge";
import { requireUserId } from "@/lib/session";
import { DEFAULT_USER_ID } from "./schema";
import type { Goal } from "@/lib/goals";
import type { Reflection } from "@/lib/reflections";
import type { DailyLog, Habit, Knowledge, Task } from "@/lib/types";

// Lớp đọc mà trang dùng — cùng tên hàm như thời Notion (lib/notion/data.ts) nhưng đọc Postgres, theo người đang đăng nhập.
// Không còn cache dùng chung giữa người dùng (SPEC-v1.0 mục 4) và không còn `stale`: lỗi database thì ném lỗi, error.tsx hiện.

export type Loaded<T> = { data: T; stale: boolean };
const fresh = <T>(data: T): Loaded<T> => ({ data, stale: false });

// React cache(): mỗi getter chỉ chạy một lần trong MỘT request (nhiều thành phần cùng gọi → dùng lại kết quả).
// Không dùng chung giữa các request hay người dùng, nên vẫn đúng quy tắc "không cache dữ liệu dùng chung" (rà soát A4).
const scope = cache(async () => ({ db: getDb(), userId: await requireUserId() }));

export const getTasks = cache(async (): Promise<Loaded<Task[]>> => {
  const { db, userId } = await scope();
  return fresh(await listTasks(db, userId));
});

/** Ghi chú kiến thức của người đang đăng nhập (SPEC.md mục 10.1). */
export const getKnowledge = cache(async (): Promise<Loaded<Knowledge[]>> => {
  const { db, userId } = await scope();
  return fresh(await listKnowledge(db, userId));
});

/** Lĩnh vực chọn được khi thêm / sửa ghi chú. */
export const getKnowledgeFields = cache(async (): Promise<string[]> => {
  const { db, userId } = await scope();
  return listFieldNames(db, userId);
});

/** Lĩnh vực + số ghi chú gắn (trang Cài đặt). */
export async function getFieldsWithCounts() {
  const { db, userId } = await scope();
  return listFieldsWithCounts(db, userId);
}

export const getRecentDailyLogs = cache(async (): Promise<Loaded<DailyLog[]>> => {
  const { db, userId } = await scope();
  return fresh(await listRecentDailyLogs(db, userId));
});

export const getDailyLogsBetween = cache(async (start: string, end: string): Promise<Loaded<DailyLog[]>> => {
  const { db, userId } = await scope();
  return fresh(await listDailyLogsBetween(db, userId, start, end));
});

/** 90 bản ghi gần nhất cho Dashboard (SPEC-v0.3 4.4). */
export const getDailyLogs90 = cache(async (): Promise<Loaded<DailyLog[]>> => {
  const { db, userId } = await scope();
  return fresh(await listRecentDailyLogs(db, userId, 90));
});

export const getHabits = cache(async (): Promise<Loaded<Habit[]>> => {
  const { db, userId } = await scope();
  return fresh(await listHabits(db, userId));
});

export const getGoals = cache(async (): Promise<Loaded<Goal[]>> => {
  const { db, userId } = await scope();
  return fresh(await listGoals(db, userId));
});

export const getReflections = cache(async (): Promise<Loaded<Reflection[]>> => {
  const { db, userId } = await scope();
  return fresh(await listReflections(db, userId));
});

/** Dự án chọn được khi thêm/sửa task: danh sách dự án của người dùng. */
export const getTaskProjects = cache(async (): Promise<string[]> => {
  const { db, userId } = await scope();
  return listProjectNames(db, userId);
});

export const anyStale = (...loaded: Loaded<unknown>[]) => loaded.some((l) => l.stale);

export type { Profile } from "./queries";

/**
 * Hồ sơ + đếm ngược của người đang đăng nhập. Thẻ đếm ngược: hạn trong Cài đặt; riêng user mặc định (Trung) chưa đặt thì
 * dùng `THESIS_DEADLINE` như trước (SPEC-v1.0 bước 5). Người khác chưa đặt hạn → không hiện thẻ.
 */
export const getProfile = cache(async () => {
  const { db, userId } = await scope();
  const p = (await getProfileRow(db, userId)) ?? { name: "", email: null, targetDate: null, targetLabel: "" };
  const fromEnv = userId === DEFAULT_USER_ID ? (process.env.THESIS_DEADLINE ?? null) : null;
  return {
    ...p,
    target: { date: p.targetDate ?? fromEnv, label: p.targetLabel.trim() || (p.targetDate === null && fromEnv ? "hạn nộp đồ án" : "hạn chót") },
  };
});

/** Dự án + số việc gắn (trang Cài đặt). */
export async function getProjectsWithCounts() {
  const { db, userId } = await scope();
  return listProjectsWithCounts(db, userId);
}
