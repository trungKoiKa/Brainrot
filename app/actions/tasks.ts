"use server";

import { getGoals, getTaskProjects } from "@/lib/db/data";
import { BAD_REQUEST, okOnly, runWrite, type OkResult } from "@/lib/db/actions-db";
import { createTask, deleteTask, markTaskDone, reopenTask, restoreTask, setTaskPlannedOn, setTaskTop, TOP_FULL, updateTask, type TaskSnapshot } from "@/lib/db/tasks";
import { isDay, isId } from "@/lib/ids";
import { MAX_TEXT } from "@/lib/quick-capture";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";
import { parseTaskInput, parseTaskUpdate } from "@/lib/task-form";

export type CompleteTaskResult = OkResult;
export type TaskFormState = { ok?: boolean; message?: string; at?: number };

const BAD_ID = "ID task không hợp lệ.";

export async function completeTask(pageId: string): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (!isId(pageId)) return { ok: false, error: BAD_ID };
  return okOnly(await runWrite("completeTask", (db, userId) => markTaskDone(db, userId, pageId)));
}

/** Hoàn tác tích xong / bỏ tích trong "Đã xong" (SPEC.md mục 5.2, 07/11/2026). */
export async function reopenTaskAction(pageId: string, status: "Chưa làm" | "Đang làm" = "Chưa làm"): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (!isId(pageId)) return { ok: false, error: BAD_ID };
  if (status !== "Chưa làm" && status !== "Đang làm") return { ok: false, error: "Trạng thái không hợp lệ." };
  return okOnly(await runWrite("reopenTask", (db, userId) => reopenTask(db, userId, pageId, status)));
}

export async function createTaskAction(_prev: TaskFormState, form: FormData): Promise<TaskFormState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseTaskInput(form, await getTaskProjects());
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const r = await runWrite("createTask", (db, userId) => createTask(db, userId, parsed.data));
  if (!r.ok) return { ok: false, message: r.error };
  return { ok: true, message: `Đã thêm “${parsed.data.title}”.`, at: Date.now() };
}

export async function updateTaskAction(_prev: TaskFormState, form: FormData): Promise<TaskFormState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const id = form.get("id");
  if (!isId(id)) return { ok: false, message: BAD_ID };
  const parsed = parseTaskUpdate(form, await getTaskProjects(), (await getGoals()).map((g) => g.id));
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const r = await runWrite("updateTask", (db, userId) => updateTask(db, userId, id, parsed.data));
  if (!r.ok) return { ok: false, message: r.error };
  return { ok: true, message: "Đã lưu.", at: Date.now() };
}

/** Xoá hẳn task (SPEC.md mục 5.2); giao diện có Hoàn tác bằng restoreTaskAction. */
export async function deleteTaskAction(pageId: string): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (!isId(pageId)) return { ok: false, error: BAD_ID };
  return okOnly(await runWrite("deleteTask", (db, userId) => deleteTask(db, userId, pageId)));
}

/** Đặt / bỏ Ngày làm (SPEC.md mục 5.2): "Làm hôm nay", "Dời sang…", chọn việc ngày mai. `day` null = bỏ lịch. */
export async function planTaskAction(pageId: string, day: string | null): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (!isId(pageId)) return { ok: false, error: BAD_ID };
  if (day !== null && !isDay(day)) return { ok: false, error: "Ngày không hợp lệ." };
  return okOnly(await runWrite("planTask", (db, userId) => setTaskPlannedOn(db, userId, pageId, day)));
}

/** Gắn / bỏ sao "3 việc" cho một ngày (SPEC.md mục 12.1). `day` null = bỏ sao. */
export async function setTopAction(pageId: string, day: string | null): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (!isId(pageId)) return { ok: false, error: BAD_ID };
  if (day !== null && !isDay(day)) return { ok: false, error: "Ngày không hợp lệ." };
  return okOnly(await runWrite("setTop", (db, userId) => setTaskTop(db, userId, pageId, day), { [TOP_FULL]: TOP_FULL }));
}

const STATUS_SET = ["Chưa làm", "Đang làm", "Xong"];
const PRIORITY_SET = ["Cao", "Vừa", "Thấp"];
const dayOrNull = (v: unknown) => v === null || isDay(v);

/** Hoàn tác xoá task (SPEC.md mục 5.2): chèn lại đúng id từ ảnh chụp mà giao diện giữ. */
export async function restoreTaskAction(snapshot: TaskSnapshot): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  const s = snapshot as Partial<TaskSnapshot> | null;
  const valid =
    s !== null &&
    typeof s === "object" &&
    isId(s.id) &&
    typeof s.title === "string" &&
    s.title.length <= MAX_TEXT &&
    typeof s.note === "string" &&
    s.note.length <= MAX_TEXT &&
    (s.project === null || typeof s.project === "string") &&
    (s.status === null || (typeof s.status === "string" && STATUS_SET.includes(s.status))) &&
    (s.priority === null || (typeof s.priority === "string" && PRIORITY_SET.includes(s.priority))) &&
    dayOrNull(s.deadline) &&
    dayOrNull(s.plannedOn) &&
    dayOrNull(s.doneOn) &&
    (s.topOn === undefined || dayOrNull(s.topOn)) &&
    typeof s.createdTime === "string" &&
    !Number.isNaN(Date.parse(s.createdTime)) &&
    Array.isArray(s.goalIds) &&
    s.goalIds.every(isId);
  if (!valid) return { ok: false, error: BAD_REQUEST };
  return okOnly(await runWrite("restoreTask", (db, userId) => restoreTask(db, userId, snapshot)));
}
