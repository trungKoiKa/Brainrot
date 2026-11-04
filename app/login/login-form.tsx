"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-muted-foreground">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoFocus
        autoComplete="username"
        className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
      />
      <label htmlFor="password" className="mt-1 text-sm text-muted-foreground">
        Mật khẩu
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
      />
      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-primary px-3 py-2 font-medium text-surface transition-opacity disabled:opacity-60"
      >
        {pending ? "Đang kiểm tra…" : "Vào"}
      </button>
    </form>
  );
}
