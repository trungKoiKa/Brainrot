"use server";

import { GOAL_TYPES, MAX_GOAL_TITLE, type GoalType } from "@/lib/goals";
import { dbScope } from "@/lib/db/actions-db";
import { carryOverGoals, createGoal, setTaskGoal, trashGoal, updateGoal, type GoalPatch } from "@/lib/db/mutations";
import { refreshData } from "@/lib/db/revalidate";
import { LEVELS, parsePeriod, shiftPeriod, type Level } from "@/lib/period";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type GoalResult = { ok: true } | { ok: false; error: string };
export type CreateGoalResult = { ok: true; id: string } | { ok: false; error: string };

const PAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WRITE_FAILED = "Không lưu được, thử lại sau.";

async function guard(): Promise<{ ok: false; error: string } | null> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  return null;
}

function cleanTitle(raw: unknown): string | { error: string } {
  const title = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!title) return { error: "Nhập nội dung mục tiêu." };
  if (title.length > MAX_GOAL_TITLE) return { error: `Mục tiêu tối đa ${MAX_GOAL_TITLE} ký tự.` };
  return title;
}

const isType = (t: unknown): t is GoalType => GOAL_TYPES.includes(t as GoalType);

/** Thêm mục tiêu vào kỳ `key` của cấp `level`; "Kỳ" luôn là ngày đầu kỳ do server tính. */
export async function createGoalAction(level: Level, key: string, rawTitle: string, type: GoalType): Promise<CreateGoalResult> {
  const denied = await guard();
  if (denied) return denied;
  const period = LEVELS.includes(level) ? parsePeriod(level, key) : null;
  if (!period || !isType(type)) return { ok: false, error: "Yêu cầu không hợp lệ." };
  const title = cleanTitle(rawTitle);
  if (typeof title !== "string") return { ok: false, ...title };

  try {
    const { db, userId } = await dbScope();
    const id = await createGoal(db, userId, period.level, period.start, title, type);
    refreshData();
    return { ok: true, id };
  } catch (e) {
    console.error("createGoal failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
}

/** Sửa tên / đổi Ưu tiên ↔ Thường / tích xong / gắn thói quen + ngưỡng % (SPEC-v0.4 4.3). */
export async function updateGoalAction(id: string, patch: GoalPatch): Promise<GoalResult> {
  const denied = await guard();
  if (denied) return denied;
  if (typeof id !== "string" || !PAGE_ID.test(id) || typeof patch !== "object" || patch === null) {
    return { ok: false, error: "Yêu cầu không hợp lệ." };
  }
  const clean: GoalPatch = {};
  if (patch.title !== undefined) {
    const title = cleanTitle(patch.title);
    if (typeof title !== "string") return { ok: false, ...title };
    clean.title = title;
  }
  if (patch.type !== undefined) {
    if (!isType(patch.type)) return { ok: false, error: "Loại không hợp lệ." };
    clean.type = patch.type;
  }
  if (patch.done !== undefined) clean.done = patch.done === true;
  if (patch.habitId !== undefined) {
    if (patch.habitId !== null && (typeof patch.habitId !== "string" || !PAGE_ID.test(patch.habitId))) {
      return { ok: false, error: "Thói quen không hợp lệ." };
    }
    clean.habitId = patch.habitId; // updateGoal kiểm tra thói quen có thuộc người dùng
  }
  if (patch.threshold !== undefined) {
    const t = patch.threshold;
    if (t !== null && (!Number.isInteger(t) || t < 1 || t > 100)) return { ok: false, error: "Ngưỡng phải từ 1 đến 100%." };
    clean.threshold = t;
  }

  try {
    const { db, userId } = await dbScope();
    await updateGoal(db, userId, id, clean);
  } catch (e) {
    console.error("updateGoal failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}

/** Xóa mềm hoặc hoàn tác xóa. */
export async function trashGoalAction(id: string, trashed: boolean): Promise<GoalResult> {
  const denied = await guard();
  if (denied) return denied;
  if (typeof id !== "string" || !PAGE_ID.test(id)) return { ok: false, error: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    await trashGoal(db, userId, id, trashed === true);
  } catch (e) {
    console.error("trashGoal failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData(); // các nơi đọc mục tiêu (chip tuần, % kỳ) cần thấy thay đổi; panel giữ nguyên nút Hoàn tác nhờ không dựng lại
  return { ok: true };
}

export type CarryResult = { ok: true; ids: string[] } | { ok: false; error: string };

/** Chuyển mục tiêu chưa xong của kỳ `key` sang kỳ kế tiếp (SPEC-v1.0, Goal đợt 2). */
export async function carryOverGoalsAction(level: Level, key: string): Promise<CarryResult> {
  const denied = await guard();
  if (denied) return denied;
  const period = LEVELS.includes(level) ? parsePeriod(level, key) : null;
  if (!period) return { ok: false, error: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    const ids = await carryOverGoals(db, userId, period.level, period.start, shiftPeriod(period, 1).start);
    refreshData();
    return { ok: true, ids };
  } catch (e) {
    console.error("carryOverGoals failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
}

/** Gắn việc vào mục tiêu (hoặc bỏ gắn khi `goalId` null) ngay từ dòng mục tiêu. */
export async function linkTaskAction(taskId: string, goalId: string | null): Promise<GoalResult> {
  const denied = await guard();
  if (denied) return denied;
  if (typeof taskId !== "string" || !PAGE_ID.test(taskId) || (goalId !== null && (typeof goalId !== "string" || !PAGE_ID.test(goalId)))) {
    return { ok: false, error: "Yêu cầu không hợp lệ." };
  }
  try {
    const { db, userId } = await dbScope();
    await setTaskGoal(db, userId, taskId, goalId);
  } catch (e) {
    console.error("setTaskGoal failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}
