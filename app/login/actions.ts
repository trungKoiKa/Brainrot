"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/password";

export type LoginState = { error?: string };

// Hash giả để người dùng không tồn tại cũng tốn cùng thời gian băm → không dò được email nào có tài khoản
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isDbConfigured() || !process.env.AUTH_SECRET) {
    return { error: "Server chưa cấu hình DATABASE_URL / AUTH_SECRET." };
  }

  let userId: string | null = null;
  try {
    const [user] = email ? await getDb().select({ id: users.id, hash: users.passwordHash }).from(users).where(eq(users.email, email)) : [];
    const ok = await verifyPassword(password, user?.hash ?? DUMMY_HASH);
    if (user && ok) userId = user.id;
  } catch (e) {
    console.error("login failed:", e instanceof Error ? e.message : e);
    return { error: "Không kết nối được database, thử lại sau." };
  }

  if (!userId) {
    // Chậm lại một chút để việc thử mật khẩu hàng loạt tốn thời gian hơn
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Sai email hoặc mật khẩu." };
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}
