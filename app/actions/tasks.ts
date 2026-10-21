"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { markTaskDone } from "@/lib/notion/mutations";
import { TAGS } from "@/lib/notion/queries";

export type CompleteTaskResult = { ok: true } | { ok: false; error: string };

const PAGE_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export async function completeTask(pageId: string): Promise<CompleteTaskResult> {
  // Server Action là một endpoint POST riêng → tự kiểm tra đăng nhập, không chỉ dựa vào proxy
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(session))) return { ok: false, error: "Phiên đăng nhập đã hết, hãy đăng nhập lại." };
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
