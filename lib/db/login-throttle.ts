// Chống dò mật khẩu (SPEC-v1.0 bước 5C): khoá tạm một email sau nhiều lần đăng nhập sai trong cửa sổ trượt.
// Các hàm nhận `db` như phần còn lại của lib/db; nơi gọi tự quyết định "mở" hay "đóng" khi bảng chưa có / lỗi kết nối.

import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { Db } from "./client";
import { loginAttempts } from "./schema";

export const MAX_FAILURES = 5;
export const WINDOW_MINUTES = 15;

const since = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** Số lần sai của `email` trong cửa sổ gần nhất. */
export async function recentFailures(db: Db, email: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), gte(loginAttempts.createdAt, since(WINDOW_MINUTES))));
  return Number(row.n);
}

export const isLocked = (failures: number) => failures >= MAX_FAILURES;

/** Ghi một lần sai; dọn luôn các bản ghi quá 1 ngày để bảng không phình. */
export async function recordFailure(db: Db, email: string): Promise<void> {
  await db.insert(loginAttempts).values({ email: email.slice(0, 200) });
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, since(24 * 60)));
}

/** Đăng nhập đúng → xoá lịch sử sai của email đó. */
export async function clearFailures(db: Db, email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
}
