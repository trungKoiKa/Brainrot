"use server";

import { updateTag } from "next/cache";
import { markTaskDone } from "@/lib/notion/mutations";
import { TAGS } from "@/lib/notion/queries";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type CompleteTaskResult = { ok: true } | { ok: false; error: string };

const PAGE_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export async function completeTask(pageId: string): Promise<CompleteTaskResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof pageId !== "string" || !PAGE_ID.test(pageId)) return { ok: false, error: "ID task không hợp lệ." };

  try {
    await markTaskDone(pageId);
  } catch (e) {
    console.error("completeTask failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Không ghi được lên Notion, thử lại sau." };
  }

  updateTag(TAGS.tasks); // xóa cache ngay → lần render kế tiếp đọc dữ liệu mới
  return { ok: true };
}
