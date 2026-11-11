"use server";

import { getGoals, getTaskProjects } from "@/lib/db/data";
import { dbScope } from "@/lib/db/actions-db";
import { createTask, deleteTask, markTaskDone, reopenTask, restoreTask, setTaskPlannedOn, updateTask, type TaskSnapshot } from "@/lib/db/mutations";
import { MAX_TEXT } from "@/lib/quick-capture";
import { refreshData } from "@/lib/db/revalidate";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";
import { parseTaskInput, parseTaskUpdate } from "@/lib/task-form";

export type CompleteTaskResult = { ok: true } | { ok: false; error: string };
export type TaskFormState = { ok?: boolean; message?: string; at?: number };

const PAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WRITE_FAILED = "Không lưu được, thử lại sau.";

export async function completeTask(pageId: string): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof pageId !== "string" || !PAGE_ID.test(pageId)) return { ok: false, error: "ID task không hợp lệ." };

  try {
    const { db, userId } = await dbScope();
    await markTaskDone(db, userId, pageId);
  } catch (e) {
    console.error("completeTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }

  refreshData(); // bỏ cache router → lần render kế tiếp đọc dữ liệu mới
  return { ok: true };
}

/** Hoàn tác tích xong / bỏ tích trong "Đã xong" (SPEC-v1.0, 07/11/2026). */
export async function reopenTaskAction(pageId: string, status: "Chưa làm" | "Đang làm" = "Chưa làm"): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof pageId !== "string" || !PAGE_ID.test(pageId)) return { ok: false, error: "ID task không hợp lệ." };
  if (status !== "Chưa làm" && status !== "Đang làm") return { ok: false, error: "Trạng thái không hợp lệ." };

  try {
    const { db, userId } = await dbScope();
    await reopenTask(db, userId, pageId, status);
  } catch (e) {
    console.error("reopenTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }

  refreshData();
  return { ok: true };
}

export async function createTaskAction(_prev: TaskFormState, form: FormData): Promise<TaskFormState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseTaskInput(form, await getTaskProjects());
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    const { db, userId } = await dbScope();
    await createTask(db, userId, parsed.data);
  } catch (e) {
    console.error("createTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: WRITE_FAILED };
  }

  refreshData();
  return { ok: true, message: `Đã thêm “${parsed.data.title}”.`, at: Date.now() };
}

export async function updateTaskAction(_prev: TaskFormState, form: FormData): Promise<TaskFormState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const id = form.get("id");
  if (typeof id !== "string" || !PAGE_ID.test(id)) return { ok: false, message: "ID task không hợp lệ." };
  const parsed = parseTaskUpdate(form, await getTaskProjects(), (await getGoals()).data.map((g) => g.id));
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    const { db, userId } = await dbScope();
    await updateTask(db, userId, id, parsed.data);
  } catch (e) {
    console.error("updateTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: WRITE_FAILED };
  }

  refreshData();
  return { ok: true, message: "Đã lưu.", at: Date.now() };
}

/** Xóa hẳn task (SPEC-v1.0, 05/11/2026). Giao diện đã hỏi xác nhận trước khi gọi. */
export async function deleteTaskAction(pageId: string): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof pageId !== "string" || !PAGE_ID.test(pageId)) return { ok: false, error: "ID task không hợp lệ." };

  try {
    const { db, userId } = await dbScope();
    await deleteTask(db, userId, pageId);
  } catch (e) {
    console.error("deleteTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }

  refreshData();
  return { ok: true };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Đặt / bỏ Ngày làm (SPEC-v0.5): "Làm hôm nay", "Dời sang…", chọn việc ngày mai. `day` null = bỏ lịch. */
export async function planTaskAction(pageId: string, day: string | null): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof pageId !== "string" || !PAGE_ID.test(pageId)) return { ok: false, error: "ID task không hợp lệ." };
  if (day !== null && (typeof day !== "string" || !DAY.test(day))) return { ok: false, error: "Ngày không hợp lệ." };

  try {
    const { db, userId } = await dbScope();
    await setTaskPlannedOn(db, userId, pageId, day);
  } catch (e) {
    console.error("planTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }

  refreshData();
  return { ok: true };
}

const STATUS_SET = ["Chưa làm", "Đang làm", "Xong"];
const PRIORITY_SET = ["Cao", "Vừa", "Thấp"];
const dayOrNull = (v: unknown) => v === null || (typeof v === "string" && DAY.test(v));

/** Hoàn tác xoá task (SPEC-v1.0, Tasks đợt 3): chèn lại đúng id từ ảnh chụp mà giao diện giữ. */
export async function restoreTaskAction(snapshot: TaskSnapshot): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  const s = snapshot as Partial<TaskSnapshot> | null;
  const valid =
    s !== null &&
    typeof s === "object" &&
    typeof s.id === "string" &&
    PAGE_ID.test(s.id) &&
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
    typeof s.createdTime === "string" &&
    !Number.isNaN(Date.parse(s.createdTime)) &&
    Array.isArray(s.goalIds) &&
    s.goalIds.every((g) => typeof g === "string" && PAGE_ID.test(g));
  if (!valid) return { ok: false, error: "Yêu cầu không hợp lệ." };

  try {
    const { db, userId } = await dbScope();
    await restoreTask(db, userId, snapshot);
  } catch (e) {
    console.error("restoreTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}
