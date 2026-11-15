"use server";

import { GOAL_TYPES, MAX_GOAL_TITLE, type GoalType } from "@/lib/goals";
import { BAD_REQUEST, okOnly, runWrite, type OkResult } from "@/lib/db/actions-db";
import { carryOverGoals, createGoal, setTaskGoal, trashGoal, updateGoal, type GoalPatch } from "@/lib/db/mutations";
import { isId } from "@/lib/ids";
import { LEVELS, parsePeriod, shiftPeriod, type Level } from "@/lib/period";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type GoalResult = OkResult;
export type CreateGoalResult = { ok: true; id: string } | { ok: false; error: string };
export type CarryResult = { ok: true; ids: string[] } | { ok: false; error: string };

const EXPIRED = { ok: false, error: SESSION_EXPIRED } as const;
const INVALID = { ok: false, error: BAD_REQUEST } as const;

function cleanTitle(raw: unknown): string | { error: string } {
  const title = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!title) return { error: "Nhập nội dung mục tiêu." };
  if (title.length > MAX_GOAL_TITLE) return { error: `Mục tiêu tối đa ${MAX_GOAL_TITLE} ký tự.` };
  return title;
}

const isType = (t: unknown): t is GoalType => GOAL_TYPES.includes(t as GoalType);
const periodOf = (level: Level, key: string) => (LEVELS.includes(level) ? parsePeriod(level, key) : null);

/** Thêm mục tiêu vào kỳ `key` của cấp `level`; "Kỳ" luôn là ngày đầu kỳ do server tính. */
export async function createGoalAction(level: Level, key: string, rawTitle: string, type: GoalType): Promise<CreateGoalResult> {
  if (!(await isSignedIn())) return EXPIRED;
  const period = periodOf(level, key);
  if (!period || !isType(type)) return INVALID;
  const title = cleanTitle(rawTitle);
  if (typeof title !== "string") return { ok: false, ...title };
  const r = await runWrite("createGoal", (db, userId) => createGoal(db, userId, period.level, period.start, title, type));
  return r.ok ? { ok: true, id: r.value } : r;
}

/** Sửa tên / đổi Ưu tiên ↔ Thường / tích xong / gắn thói quen + ngưỡng % (SPEC.md mục 5.3). */
export async function updateGoalAction(id: string, patch: GoalPatch): Promise<GoalResult> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isId(id) || typeof patch !== "object" || patch === null) return INVALID;
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
    if (patch.habitId !== null && !isId(patch.habitId)) return { ok: false, error: "Thói quen không hợp lệ." };
    clean.habitId = patch.habitId; // updateGoal kiểm tra thói quen có thuộc người dùng
  }
  if (patch.threshold !== undefined) {
    const t = patch.threshold;
    if (t !== null && (!Number.isInteger(t) || t < 1 || t > 100)) return { ok: false, error: "Ngưỡng phải từ 1 đến 100%." };
    clean.threshold = t;
  }
  return okOnly(await runWrite("updateGoal", (db, userId) => updateGoal(db, userId, id, clean)));
}

/** Xoá mềm hoặc hoàn tác xoá. Các nơi đọc mục tiêu (chip tuần, % kỳ) thấy thay đổi nhờ refreshData trong runWrite. */
export async function trashGoalAction(id: string, trashed: boolean): Promise<GoalResult> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isId(id)) return INVALID;
  return okOnly(await runWrite("trashGoal", (db, userId) => trashGoal(db, userId, id, trashed === true)));
}

/** Chuyển mục tiêu chưa xong của kỳ `key` sang kỳ kế tiếp (SPEC.md mục 5.3). */
export async function carryOverGoalsAction(level: Level, key: string, goalIds: string[]): Promise<CarryResult> {
  if (!(await isSignedIn())) return EXPIRED;
  const period = periodOf(level, key);
  if (!period || !Array.isArray(goalIds) || goalIds.length > 200 || !goalIds.every(isId)) return INVALID;
  const r = await runWrite("carryOverGoals", (db, userId) =>
    carryOverGoals(db, userId, period.level, period.start, shiftPeriod(period, 1).start, goalIds),
  );
  return r.ok ? { ok: true, ids: r.value } : r;
}

/** Gắn việc vào mục tiêu (hoặc bỏ gắn khi `goalId` null) ngay từ dòng mục tiêu. */
export async function linkTaskAction(taskId: string, goalId: string | null): Promise<GoalResult> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isId(taskId) || (goalId !== null && !isId(goalId))) return INVALID;
  return okOnly(await runWrite("setTaskGoal", (db, userId) => setTaskGoal(db, userId, taskId, goalId)));
}
