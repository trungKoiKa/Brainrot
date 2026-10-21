"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm text-muted">
        Mật khẩu
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-accent"
      />
      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-accent px-3 py-2 font-medium text-surface transition-opacity disabled:opacity-60"
      >
        {pending ? "Đang kiểm tra…" : "Vào"}
      </button>
    </form>
  );
}
