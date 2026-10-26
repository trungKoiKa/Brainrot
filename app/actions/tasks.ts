"use server";

import { updateTag } from "next/cache";
import { createTask, markTaskDone, updateTask } from "@/lib/notion/mutations";
import { getGoals, getTaskProjects } from "@/lib/notion/data";
import { TAGS } from "@/lib/notion/queries";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";
import { parseTaskInput, parseTaskUpdate } from "@/lib/task-form";

export type CompleteTaskResult = { ok: true } | { ok: false; error: string };
export type TaskFormState = { ok?: boolean; message?: string; at?: number };

const PAGE_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const WRITE_FAILED = "Không ghi được lên Notion, thử lại sau.";

export async function completeTask(pageId: string): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof pageId !== "string" || !PAGE_ID.test(pageId)) return { ok: false, error: "ID task không hợp lệ." };

  try {
    await markTaskDone(pageId);
  } catch (e) {
    console.error("completeTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }

  updateTag(TAGS.tasks); // xóa cache ngay → lần render kế tiếp đọc dữ liệu mới
  return { ok: true };
}

export async function createTaskAction(_prev: TaskFormState, form: FormData): Promise<TaskFormState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseTaskInput(form, await getTaskProjects());
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    await createTask(parsed.data);
  } catch (e) {
    console.error("createTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: WRITE_FAILED };
  }

  updateTag(TAGS.tasks);
  return { ok: true, message: `Đã thêm “${parsed.data.title}”.`, at: Date.now() };
}

export async function updateTaskAction(_prev: TaskFormState, form: FormData): Promise<TaskFormState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const id = form.get("id");
  if (typeof id !== "string" || !PAGE_ID.test(id)) return { ok: false, message: "ID task không hợp lệ." };
  const parsed = parseTaskUpdate(form, await getTaskProjects(), (await getGoals()).data.map((g) => g.id));
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    await updateTask(id, parsed.data);
  } catch (e) {
    console.error("updateTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: WRITE_FAILED };
  }

  updateTag(TAGS.tasks);
  if (parsed.data.goalId !== undefined) updateTag(TAGS.goals); // relation 2 chiều → cột Tasks bên Goals cũng đổi
  return { ok: true, message: "Đã lưu.", at: Date.now() };
}
