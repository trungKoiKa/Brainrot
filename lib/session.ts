import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/** Server Action là endpoint POST riêng → phải tự kiểm tra đăng nhập, không chỉ dựa vào proxy.ts. */
export async function isSignedIn(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export const SESSION_EXPIRED = "Phiên đăng nhập đã hết, hãy đăng nhập lại.";
