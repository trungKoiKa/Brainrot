import "server-only";
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
} from "./queries";
import { requireUserId } from "@/lib/session";
import { DEFAULT_USER_ID } from "./schema";
import type { Goal } from "@/lib/goals";
import type { Reflection } from "@/lib/reflections";
import type { DailyLog, Habit, Knowledge, Task } from "@/lib/types";

// Lớp đọc mà trang dùng — cùng tên hàm như thời Notion (lib/notion/data.ts) nhưng đọc Postgres, theo người đang đăng nhập.
// Không còn cache dùng chung giữa người dùng (SPEC-v1.0 mục 4) và không còn `stale`: lỗi database thì ném lỗi, error.tsx hiện.

export type Loaded<T> = { data: T; stale: boolean };
const fresh = <T>(data: T): Loaded<T> => ({ data, stale: false });

async function scope() {
  return { db: getDb(), userId: await requireUserId() };
}

export const getTasks = async (): Promise<Loaded<Task[]>> => {
  const { db, userId } = await scope();
  return fresh(await listTasks(db, userId));
};

/** Đợt 1 chưa có Knowledge (v1.1) → luôn rỗng. */
export const getKnowledge = async (): Promise<Loaded<Knowledge[]>> => fresh([]);

export const getRecentDailyLogs = async (): Promise<Loaded<DailyLog[]>> => {
  const { db, userId } = await scope();
  return fresh(await listRecentDailyLogs(db, userId));
};

export const getDailyLogsBetween = async (start: string, end: string): Promise<Loaded<DailyLog[]>> => {
  const { db, userId } = await scope();
  return fresh(await listDailyLogsBetween(db, userId, start, end));
};

/** 90 bản ghi gần nhất cho Dashboard (SPEC-v0.3 4.4). */
export const getDailyLogs90 = async (): Promise<Loaded<DailyLog[]>> => {
  const { db, userId } = await scope();
  return fresh(await listRecentDailyLogs(db, userId, 90));
};

export const getHabits = async (): Promise<Loaded<Habit[]>> => {
  const { db, userId } = await scope();
  return fresh(await listHabits(db, userId));
};

export const getGoals = async (): Promise<Loaded<Goal[]>> => {
  const { db, userId } = await scope();
  return fresh(await listGoals(db, userId));
};

export const getReflections = async (): Promise<Loaded<Reflection[]>> => {
  const { db, userId } = await scope();
  return fresh(await listReflections(db, userId));
};

/** Dự án chọn được khi thêm/sửa task: danh sách dự án của người dùng. */
export async function getTaskProjects(): Promise<string[]> {
  const { db, userId } = await scope();
  return listProjectNames(db, userId);
}

export const anyStale = (...loaded: Loaded<unknown>[]) => loaded.some((l) => l.stale);

export type { Profile } from "./queries";

/**
 * Hồ sơ + đếm ngược của người đang đăng nhập. Thẻ đếm ngược: hạn trong Cài đặt; riêng user mặc định (Trung) chưa đặt thì
 * dùng `THESIS_DEADLINE` như trước (SPEC-v1.0 bước 5). Người khác chưa đặt hạn → không hiện thẻ.
 */
export async function getProfile() {
  const { db, userId } = await scope();
  const p = (await getProfileRow(db, userId)) ?? { name: "", email: null, targetDate: null, targetLabel: "" };
  const fromEnv = userId === DEFAULT_USER_ID ? (process.env.THESIS_DEADLINE ?? null) : null;
  return {
    ...p,
    target: { date: p.targetDate ?? fromEnv, label: p.targetLabel.trim() || (p.targetDate === null && fromEnv ? "hạn nộp đồ án" : "hạn chót") },
  };
}
