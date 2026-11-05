import "server-only";
import { getDb } from "./client";
import { requireUserId } from "@/lib/session";

/** Ngữ cảnh cho Server Action: kết nối + userId lấy từ cookie (không nhận từ client). */
export async function dbScope() {
  return { db: getDb(), userId: await requireUserId() };
}
