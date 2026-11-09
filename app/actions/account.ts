"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { dbScope } from "@/lib/db/actions-db";
import { getPasswordHash, setPasswordHash, updateProfile } from "@/lib/db/mutations";
import { refreshData } from "@/lib/db/revalidate";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type AccountState = { ok?: boolean; message?: string };

const MAX_NAME = 60;
const MAX_LABEL = 40;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WRITE_FAILED = "Không lưu được, thử lại sau.";

/** Đăng xuất: xoá cookie phiên rồi về trang đăng nhập. */
export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/** Tên hiển thị + hạn / nhãn thẻ đếm ngược (SPEC-v1.0 bước 5). Hạn để trống = ẩn thẻ. */
export async function updateProfileAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ");
  const date = String(form.get("targetDate") ?? "").trim();
  const label = String(form.get("targetLabel") ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, message: "Nhập tên hiển thị." };
  if (name.length > MAX_NAME) return { ok: false, message: `Tên tối đa ${MAX_NAME} ký tự.` };
  if (label.length > MAX_LABEL) return { ok: false, message: `Nhãn tối đa ${MAX_LABEL} ký tự.` };
  if (date && (!DAY.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))) return { ok: false, message: "Ngày không hợp lệ." };

  try {
    const { db, userId } = await dbScope();
    await updateProfile(db, userId, { name, targetDate: date || null, targetLabel: label });
  } catch (e) {
    console.error("updateProfile failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: WRITE_FAILED };
  }
  refreshData();
  return { ok: true, message: "Đã lưu." };
}

/** Đổi mật khẩu: phải nhập đúng mật khẩu hiện tại; mật khẩu mới ≥ 8 ký tự và khác mật khẩu cũ. */
export async function changePasswordAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (next.length < MIN_PASSWORD_LENGTH) return { ok: false, message: `Mật khẩu mới tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.` };
  if (next !== confirm) return { ok: false, message: "Hai lần nhập mật khẩu mới không khớp." };
  if (next === current) return { ok: false, message: "Mật khẩu mới phải khác mật khẩu hiện tại." };

  try {
    const { db, userId } = await dbScope();
    if (!(await verifyPassword(current, await getPasswordHash(db, userId)))) {
      await new Promise((r) => setTimeout(r, 800)); // chậm lại cho việc thử đoán mật khẩu hiện tại
      return { ok: false, message: "Mật khẩu hiện tại không đúng." };
    }
    await setPasswordHash(db, userId, await hashPassword(next));
  } catch (e) {
    console.error("changePassword failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: WRITE_FAILED };
  }
  return { ok: true, message: "Đã đổi mật khẩu." };
}
