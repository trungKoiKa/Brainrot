"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction, type AccountState } from "@/app/actions/account";
import { Status, fieldClass, primaryButtonClass } from "@/components/form-bits";

// Trùng MIN_PASSWORD_LENGTH ở lib/password.ts (file đó dùng node:crypto nên không import vào bundle trình duyệt)
const MIN_PASSWORD_LENGTH = 8;
const label = "space-y-1 text-sm";
const hint = "text-xs text-muted-foreground";

/** Tên hiển thị + hạn / nhãn thẻ đếm ngược. Hạn để trống → ẩn thẻ. Email chỉ đọc (đổi email nhờ Trung). */
export function ProfileForm({ email, name, targetDate, targetLabel }: { email: string | null; name: string; targetDate: string; targetLabel: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label className={`${label} md:col-span-2`}>
        <span className="text-muted-foreground">Email đăng nhập</span>
        <input value={email ?? "(chưa gắn email)"} readOnly aria-readonly="true" className={`${fieldClass} text-muted-foreground`} />
      </label>
      <label className={`${label} md:col-span-2`}>
        <span className="text-muted-foreground">Tên hiển thị</span>
        <input name="name" defaultValue={name} maxLength={60} required autoComplete="name" className={fieldClass} />
        <span className={hint}>Từ cuối của tên dùng trong lời chào (vd. “Anh Trung” → “Chào buổi sáng, Trung”).</span>
      </label>
      <label className={label}>
        <span className="text-muted-foreground">Hạn cần nhớ (đếm ngược)</span>
        <input name="targetDate" type="date" defaultValue={targetDate} className={fieldClass} />
        <span className={hint}>Để trống nếu không cần thẻ đếm ngược.</span>
      </label>
      <label className={label}>
        <span className="text-muted-foreground">Tên của hạn đó</span>
        <input name="targetLabel" defaultValue={targetLabel} maxLength={40} placeholder="vd. hạn nộp đồ án" className={fieldClass} />
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Status state={state} />
        <button type="submit" disabled={pending} className={`ml-auto ${primaryButtonClass}`}>
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3" key={state.ok ? "done" : "form"}>
      <label className={label}>
        <span className="text-muted-foreground">Mật khẩu hiện tại</span>
        <input name="current" type="password" required autoComplete="current-password" className={fieldClass} />
      </label>
      <label className={label}>
        <span className="text-muted-foreground">Mật khẩu mới</span>
        <input name="next" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={fieldClass} />
        <span className={hint}>Tối thiểu {MIN_PASSWORD_LENGTH} ký tự.</span>
      </label>
      <label className={label}>
        <span className="text-muted-foreground">Nhập lại mật khẩu mới</span>
        <input name="confirm" type="password" required autoComplete="new-password" className={fieldClass} />
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-3">
        <Status state={state} />
        <button type="submit" disabled={pending} className={`ml-auto ${primaryButtonClass}`}>
          {pending ? "Đang đổi…" : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  );
}
