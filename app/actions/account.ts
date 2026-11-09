"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { dbScope } from "@/lib/db/actions-db";
import {
  MAX_PROJECT_NAME,
  createProject,
  deleteProject,
  getPasswordHash,
  renameProject,
  setPasswordHash,
  updateProfile,
} from "@/lib/db/mutations";
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

// ---------- Dự án (SPEC-v1.0 bước 5B) ----------

const PAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanProjectName(raw: unknown): string | { error: string } {
  const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!name) return { error: "Nhập tên dự án." };
  if (name.length > MAX_PROJECT_NAME) return { error: `Tên dự án tối đa ${MAX_PROJECT_NAME} ký tự.` };
  return name;
}

const projectError = (e: unknown): string => {
  const m = e instanceof Error ? e.message : "";
  if (m === "Đã có dự án tên này" || m === "Dự án còn việc" || m === "Không tìm thấy dự án") return m === "Dự án còn việc" ? "Dự án còn việc, chuyển hoặc xoá việc trước." : m;
  console.error("project action failed:", m);
  return WRITE_FAILED;
};

export async function createProjectAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const name = cleanProjectName(form.get("name"));
  if (typeof name !== "string") return { ok: false, message: name.error };
  try {
    const { db, userId } = await dbScope();
    await createProject(db, userId, name);
  } catch (e) {
    return { ok: false, message: projectError(e) };
  }
  refreshData();
  return { ok: true, message: `Đã thêm “${name}”.` };
}

export async function renameProjectAction(id: string, rawName: string): Promise<AccountState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  if (typeof id !== "string" || !PAGE_ID.test(id)) return { ok: false, message: "Yêu cầu không hợp lệ." };
  const name = cleanProjectName(rawName);
  if (typeof name !== "string") return { ok: false, message: name.error };
  try {
    const { db, userId } = await dbScope();
    await renameProject(db, userId, id, name);
  } catch (e) {
    return { ok: false, message: projectError(e) };
  }
  refreshData();
  return { ok: true, message: "Đã đổi tên." };
}

export async function deleteProjectAction(id: string): Promise<AccountState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  if (typeof id !== "string" || !PAGE_ID.test(id)) return { ok: false, message: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    await deleteProject(db, userId, id);
  } catch (e) {
    return { ok: false, message: projectError(e) };
  }
  refreshData();
  return { ok: true, message: "Đã xoá dự án." };
}
