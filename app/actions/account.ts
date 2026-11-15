"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { BAD_REQUEST, UserError, runWrite } from "@/lib/db/actions-db";
import type { Db } from "@/lib/db/client";
import { deleteUser, getUserEmail, getPasswordHash, setPasswordHash, updateProfile } from "@/lib/db/account";
import { MAX_PROJECT_NAME, createProject, deleteProject, renameProject } from "@/lib/db/projects";
import { isDay, isId } from "@/lib/ids";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type AccountState = { ok?: boolean; message?: string };

const MAX_NAME = 60;
const MAX_LABEL = 40;
const EXPIRED: AccountState = { ok: false, message: SESSION_EXPIRED };

const slowDown = () => new Promise((r) => setTimeout(r, 800)); // chậm lại cho việc thử đoán mật khẩu

/** runWrite rồi đổi sang dạng `{ ok, message }` mà các form Cài đặt dùng. */
async function write(name: string, fn: (db: Db, userId: string) => Promise<unknown>, ok: string, known?: Record<string, string>): Promise<AccountState> {
  const r = await runWrite(name, fn, known);
  return r.ok ? { ok: true, message: ok } : { ok: false, message: r.error };
}

/** Đăng xuất: xoá cookie phiên rồi về trang đăng nhập. */
export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?out=1"); // trang đăng nhập hiện "Đã đăng xuất." (rà soát A2)
}

/** Tên hiển thị + hạn / nhãn thẻ đếm ngược (SPEC.md mục 4). Hạn để trống = ẩn thẻ. */
export async function updateProfileAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  if (!(await isSignedIn())) return EXPIRED;
  const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ");
  const date = String(form.get("targetDate") ?? "").trim();
  const label = String(form.get("targetLabel") ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, message: "Nhập tên hiển thị." };
  if (name.length > MAX_NAME) return { ok: false, message: `Tên tối đa ${MAX_NAME} ký tự.` };
  if (label.length > MAX_LABEL) return { ok: false, message: `Nhãn tối đa ${MAX_LABEL} ký tự.` };
  if (date && (!isDay(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))) return { ok: false, message: "Ngày không hợp lệ." };
  return write("updateProfile", (db, userId) => updateProfile(db, userId, { name, targetDate: date || null, targetLabel: label }), "Đã lưu.");
}

/** Đổi mật khẩu: phải nhập đúng mật khẩu hiện tại; mật khẩu mới ≥ 8 ký tự và khác mật khẩu cũ. */
export async function changePasswordAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  if (!(await isSignedIn())) return EXPIRED;
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (next.length < MIN_PASSWORD_LENGTH) return { ok: false, message: `Mật khẩu mới tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.` };
  if (next !== confirm) return { ok: false, message: "Hai lần nhập mật khẩu mới không khớp." };
  if (next === current) return { ok: false, message: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  return write(
    "changePassword",
    async (db, userId) => {
      if (!(await verifyPassword(current, await getPasswordHash(db, userId)))) {
        await slowDown();
        throw new UserError("Mật khẩu hiện tại không đúng.");
      }
      await setPasswordHash(db, userId, await hashPassword(next));
    },
    "Đã đổi mật khẩu.",
  );
}

// ---------- Dự án (SPEC.md mục 4B) ----------

const PROJECT_ERRORS = {
  "Đã có dự án tên này": "Đã có dự án tên này",
  "Không tìm thấy dự án": "Không tìm thấy dự án",
  "Dự án còn việc": "Dự án còn việc, chuyển hoặc xoá việc trước.",
};

function cleanProjectName(raw: unknown): string | { error: string } {
  const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!name) return { error: "Nhập tên dự án." };
  if (name.length > MAX_PROJECT_NAME) return { error: `Tên dự án tối đa ${MAX_PROJECT_NAME} ký tự.` };
  return name;
}

export async function createProjectAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  if (!(await isSignedIn())) return EXPIRED;
  const name = cleanProjectName(form.get("name"));
  if (typeof name !== "string") return { ok: false, message: name.error };
  return write("createProject", (db, userId) => createProject(db, userId, name), `Đã thêm “${name}”.`, PROJECT_ERRORS);
}

export async function renameProjectAction(id: string, rawName: string): Promise<AccountState> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isId(id)) return { ok: false, message: BAD_REQUEST };
  const name = cleanProjectName(rawName);
  if (typeof name !== "string") return { ok: false, message: name.error };
  return write("renameProject", (db, userId) => renameProject(db, userId, id, name), "Đã đổi tên.", PROJECT_ERRORS);
}

export async function deleteProjectAction(id: string): Promise<AccountState> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isId(id)) return { ok: false, message: BAD_REQUEST };
  return write("deleteProject", (db, userId) => deleteProject(db, userId, id), "Đã xoá dự án.", PROJECT_ERRORS);
}

/**
 * Xoá tài khoản + toàn bộ dữ liệu (SPEC.md mục 4C): phải gõ lại đúng email và nhập mật khẩu hiện tại.
 * Không hoàn tác được. Xong thì xoá cookie, về trang đăng nhập.
 */
export async function deleteAccountAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  if (!(await isSignedIn())) return EXPIRED;
  const typed = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const result = await write(
    "deleteAccount",
    async (db, userId) => {
      const email = (await getUserEmail(db, userId))?.toLowerCase() ?? null;
      if (!email || typed !== email) throw new UserError("Email gõ lại không khớp với tài khoản.");
      if (!(await verifyPassword(password, await getPasswordHash(db, userId)))) {
        await slowDown();
        throw new UserError("Mật khẩu không đúng.");
      }
      await deleteUser(db, userId);
    },
    "",
  );
  if (!result.ok) return result;
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
