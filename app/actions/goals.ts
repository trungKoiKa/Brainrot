"use server";

import { updateTag } from "next/cache";
import { GOAL_TYPES, MAX_GOAL_TITLE, type GoalType } from "@/lib/goals";
import { getHabits } from "@/lib/notion/data";
import { createGoal, trashGoal, updateGoal, type GoalPatch } from "@/lib/notion/mutations";
import { TAGS } from "@/lib/notion/queries";
import { LEVELS, parsePeriod, type Level } from "@/lib/period";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type GoalResult = { ok: true } | { ok: false; error: string };
export type CreateGoalResult = { ok: true; id: string } | { ok: false; error: string };

const PAGE_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const WRITE_FAILED = "Không ghi được lên Notion, thử lại sau.";

async function guard(): Promise<{ ok: false; error: string } | null> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (!process.env.NOTION_GOALS_DB) return { ok: false, error: "Chưa kết nối database Goals (NOTION_GOALS_DB)." };
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
    const id = await createGoal(period.level, period.start, title, type);
    updateTag(TAGS.goals);
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
    if (patch.habitId !== null && !(await getHabits()).data.some((h) => h.id === patch.habitId)) {
      return { ok: false, error: "Thói quen không hợp lệ." };
    }
    clean.habitId = patch.habitId;
  }
  if (patch.threshold !== undefined) {
    const t = patch.threshold;
    if (t !== null && (!Number.isInteger(t) || t < 1 || t > 100)) return { ok: false, error: "Ngưỡng phải từ 1 đến 100%." };
    clean.threshold = t;
  }

  try {
    await updateGoal(id, clean);
  } catch (e) {
    console.error("updateGoal failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  updateTag(TAGS.goals);
  return { ok: true };
}

/** Xóa (vào Trash Notion) hoặc hoàn tác xóa. */
export async function trashGoalAction(id: string, trashed: boolean): Promise<GoalResult> {
  const denied = await guard();
  if (denied) return denied;
  if (typeof id !== "string" || !PAGE_ID.test(id)) return { ok: false, error: "Yêu cầu không hợp lệ." };
  try {
    await trashGoal(id, trashed === true);
  } catch (e) {
    console.error("trashGoal failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  updateTag(TAGS.goals);
  return { ok: true };
}
