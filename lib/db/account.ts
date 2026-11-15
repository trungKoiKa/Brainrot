// Hồ sơ, mật khẩu và xoá tài khoản (Cài đặt, SPEC.md mục 4): đọc + ghi, lọc theo `userId`.

import { eq } from "drizzle-orm";
import type { Db } from "./client";
import { users } from "./schema";

export type Profile = { name: string; email: string | null; targetDate: string | null; targetLabel: string };

/** Hồ sơ người đang đăng nhập (Cài đặt, lời chào, đếm ngược). */
export async function getProfileRow(db: Db, userId: string): Promise<Profile | null> {
  const [row] = await db
    .select({ name: users.name, email: users.email, targetDate: users.targetDate, targetLabel: users.targetLabel })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

export type ProfilePatch = { name: string; targetDate: string | null; targetLabel: string };

export async function updateProfile(db: Db, userId: string, p: ProfilePatch): Promise<void> {
  const res = await db
    .update(users)
    .set({ name: p.name, targetDate: p.targetDate, targetLabel: p.targetLabel })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  if (!res.length) throw new Error("Không tìm thấy tài khoản");
}

/** Mật khẩu hiện tại của user (hash), để kiểm tra trước khi đổi. */
export async function getPasswordHash(db: Db, userId: string): Promise<string | null> {
  const [row] = await db.select({ h: users.passwordHash }).from(users).where(eq(users.id, userId));
  return row?.h ?? null;
}

export async function setPasswordHash(db: Db, userId: string, hash: string): Promise<void> {
  const res = await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId)).returning({ id: users.id });
  if (!res.length) throw new Error("Không tìm thấy tài khoản");
}

// ---------- Dự án (Cài đặt, SPEC.md mục 3B) ----------

/** Xoá người dùng; mọi bảng dữ liệu có ON DELETE CASCADE nên đi theo. */
export async function deleteUser(db: Db, userId: string): Promise<void> {
  const res = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
  if (!res.length) throw new Error("Không tìm thấy tài khoản");
}

export async function getUserEmail(db: Db, userId: string): Promise<string | null> {
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
  return row?.email ?? null;
}
