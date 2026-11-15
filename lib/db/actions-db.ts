import "server-only";
import { getDb, type Db } from "./client";
import { refreshData } from "./revalidate";
import { requireUserId } from "@/lib/session";

/** Câu báo lỗi chung khi ghi database thất bại (không lộ chi tiết lỗi ra giao diện). */
export const WRITE_FAILED = "Không lưu được, thử lại sau.";
export const BAD_REQUEST = "Yêu cầu không hợp lệ.";

/** Ngữ cảnh cho Server Action: kết nối + userId lấy từ cookie (không nhận từ client). */
export async function dbScope() {
  return { db: getDb(), userId: await requireUserId() };
}

/** Lỗi do người dùng nhập sai (không phải lỗi hệ thống): ném trong `fn` của runWrite để trả nguyên câu, không ghi log. */
export class UserError extends Error {}

export type WriteResult<T> = { ok: true; value: T } | { ok: false; error: string };
/** Kết quả chỉ báo được / không (đa số action xoá, sửa nhỏ) */
export type OkResult = { ok: true } | { ok: false; error: string };

/** Bỏ `value` khi giao diện chỉ cần biết ghi được hay không. */
export const okOnly = <T>(r: WriteResult<T>): OkResult => (r.ok ? { ok: true } : r);

/**
 * Khung chung của mọi thao tác ghi trong Server Action: lấy db + userId từ cookie, chạy `fn`;
 * lỗi thì đổi sang câu dễ hiểu (lỗi đã biết trong `known`, còn lại ghi log tên thao tác + WRITE_FAILED);
 * xong thì refreshData() để trang đọc lại dữ liệu mới.
 * Server Action vẫn phải tự kiểm tra đăng nhập (isSignedIn) và dữ liệu đầu vào trước khi gọi.
 */
export async function runWrite<T>(
  name: string,
  fn: (db: Db, userId: string) => Promise<T>,
  known: Record<string, string> = {},
): Promise<WriteResult<T>> {
  let value: T;
  try {
    const { db, userId } = await dbScope();
    value = await fn(db, userId);
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    const message = e instanceof Error ? e.message : String(e);
    if (Object.hasOwn(known, message)) return { ok: false, error: known[message] };
    console.error(`${name} failed:`, message);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true, value };
}
