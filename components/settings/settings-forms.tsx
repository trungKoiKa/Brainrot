"use client";

import { useActionState, useState, useTransition } from "react";
import {
  changePasswordAction,
  createProjectAction,
  deleteAccountAction,
  deleteProjectAction,
  renameProjectAction,
  updateProfileAction,
  type AccountState,
} from "@/app/actions/account";
import { Status, fieldClass, primaryButtonClass } from "@/components/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const EMPTY_PASSWORDS = { current: "", next: "", confirm: "" };

/**
 * Đổi mật khẩu. Ô nhập có kiểm soát: sai thì giữ nguyên những gì đã gõ (rà soát A2 lỗi 3), chỉ xoá khi đổi xong.
 * Kiểm tra ngay ở trình duyệt: độ dài tối thiểu và hai ô mật khẩu mới phải khớp; server vẫn kiểm tra lại.
 */
export function PasswordForm() {
  const [v, setV] = useState(EMPTY_PASSWORDS);
  const [state, action, pending] = useActionState<AccountState, FormData>(async (prev, form) => {
    const res = await changePasswordAction(prev, form);
    if (res.ok) setV(EMPTY_PASSWORDS);
    return res;
  }, {});
  const set = (key: keyof typeof EMPTY_PASSWORDS) => (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [key]: e.target.value }));
  const short = v.next.length > 0 && v.next.length < MIN_PASSWORD_LENGTH;
  const mismatch = v.confirm.length > 0 && v.confirm !== v.next;
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <label className={label}>
        <span className="text-muted-foreground">Mật khẩu hiện tại</span>
        <Input name="current" type="password" required autoComplete="current-password" value={v.current} onChange={set("current")} />
      </label>
      <label className={label}>
        <span className="text-muted-foreground">Mật khẩu mới</span>
        <Input
          name="next"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={v.next}
          onChange={set("next")}
          aria-invalid={short || undefined}
          aria-describedby="pw-next-hint"
        />
        <span id="pw-next-hint" className={short ? "text-xs text-danger" : hint}>
          Tối thiểu {MIN_PASSWORD_LENGTH} ký tự{short ? ` (mới ${v.next.length})` : ""}.
        </span>
      </label>
      <label className={label}>
        <span className="text-muted-foreground">Nhập lại mật khẩu mới</span>
        <Input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={v.confirm}
          onChange={set("confirm")}
          aria-invalid={mismatch || undefined}
          aria-describedby="pw-confirm-hint"
        />
        <span id="pw-confirm-hint" role={mismatch ? "alert" : undefined} className="text-xs text-danger empty:hidden">
          {mismatch ? "Chưa khớp với mật khẩu mới." : ""}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-3">
        <Status state={state} />
        <Button type="submit" className="ml-auto" disabled={pending || short || mismatch}>
          {pending ? "Đang đổi…" : "Đổi mật khẩu"}
        </Button>
      </div>
    </form>
  );
}

/** Quản lý dự án của riêng mình (SPEC-v1.0 bước 5B): thêm, đổi tên tại chỗ, xoá khi không còn việc. */
export function ProjectManager({ projects }: { projects: { id: string; name: string; tasks: number }[] }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(createProjectAction, {});
  const [note, setNote] = useState<AccountState>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, startTransition] = useTransition();

  const run = (fn: () => Promise<AccountState>) =>
    startTransition(async () => {
      setNote(await fn());
    });

  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap gap-2" key={state.ok ? `ok-${state.message}` : "form"}>
        <input name="name" aria-label="Tên dự án mới" placeholder="Thêm dự án…" maxLength={40} autoComplete="off" className={`${fieldClass} min-w-48 flex-1`} />
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Đang thêm…" : "Thêm"}
        </button>
      </form>
      <Status state={note.message ? note : state} />
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có dự án nào. Thêm một dự án để nhóm việc ở Tasks.</p>
      ) : (
        <ul className="divide-y divide-line">
          {projects.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              {editing === p.id ? (
                <form
                  className="flex min-w-0 flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      const res = await renameProjectAction(p.id, draft);
                      if (res.ok) setEditing(null);
                      return res;
                    });
                  }}
                >
                  <input
                    autoFocus
                    aria-label={`Đổi tên dự án ${p.name}`}
                    value={draft}
                    maxLength={40}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                    className={`${fieldClass} py-1`}
                  />
                  <button type="submit" disabled={busy} className={`${primaryButtonClass} py-1`}>
                    Lưu
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-foreground">
                    Hủy
                  </button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{p.tasks} việc</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(p.id);
                      setDraft(p.name);
                      setNote({});
                    }}
                    className="min-h-10 rounded-md px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring md:min-h-0"
                  >
                    Đổi tên
                  </button>
                  <button
                    type="button"
                    disabled={busy || p.tasks > 0}
                    title={p.tasks > 0 ? "Còn việc trong dự án này" : undefined}
                    onClick={() => run(() => deleteProjectAction(p.id))}
                    className="min-h-10 rounded-md px-2 text-sm text-danger outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline md:min-h-0"
                  >
                    Xóa
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Xoá tài khoản + toàn bộ dữ liệu: gõ lại email và nhập mật khẩu; không hoàn tác được (SPEC-v1.0 bước 5C). */
export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(deleteAccountAction, {});
  return (
    <details className="group">
      <summary className="cursor-pointer py-2.5 text-sm font-medium text-danger">
        Xoá tài khoản…
      </summary>
      <form action={action} className="mt-3 grid gap-4 md:grid-cols-2">
        <p className="text-sm text-muted-foreground md:col-span-2">
          Xoá vĩnh viễn tài khoản và <strong className="font-medium text-foreground">toàn bộ</strong> việc, mục tiêu, thói quen, nhật ký của bạn.
          Không hoàn tác được.
        </p>
        <label className={label}>
          <span className="text-muted-foreground">Gõ lại email để xác nhận</span>
          <Input name="email" type="email" required autoComplete="off" placeholder="email của bạn" />
        </label>
        <label className={label}>
          <span className="text-muted-foreground">Mật khẩu</span>
          <Input name="password" type="password" required autoComplete="current-password" />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Status state={state} />
          {/* Nút "nguy hiểm" của thư viện: chữ đỏ trên nền đỏ nhạt, đủ tương phản ở cả hai theme (rà soát A3: 2,3:1 ở nền tối) */}
          <Button type="submit" variant="destructive" className="ml-auto" disabled={pending}>
            {pending ? "Đang xoá…" : "Xoá tài khoản vĩnh viễn"}
          </Button>
        </div>
      </form>
    </details>
  );
}
