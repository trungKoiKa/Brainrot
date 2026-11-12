import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSessionToken } from "./auth";

/** userId của người đang đăng nhập, lấy từ cookie đã ký — KHÔNG BAO GIỜ từ form hay URL (SPEC.md mục 4). */
export async function getUserId(): Promise<string | null> {
  return readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Trang nằm sau proxy.ts nên luôn có phiên; thiếu thì ném lỗi thay vì đọc dữ liệu của ai đó. */
export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error("Chưa đăng nhập");
  return id;
}

/** Server Action là endpoint POST riêng → phải tự kiểm tra đăng nhập, không chỉ dựa vào proxy.ts. */
export async function isSignedIn(): Promise<boolean> {
  return (await getUserId()) !== null;
}

export const SESSION_EXPIRED = "Phiên đăng nhập đã hết, hãy đăng nhập lại.";
