"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, createSessionToken } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  let ok: boolean;
  try {
    ok = await checkPassword(password);
  } catch {
    return { error: "Server chưa cấu hình APP_PASSWORD / AUTH_SECRET." };
  }

  if (!ok) {
    // Chậm lại một chút để việc thử mật khẩu hàng loạt tốn thời gian hơn
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Sai mật khẩu." };
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}
