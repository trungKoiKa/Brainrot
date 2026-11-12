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
import { createFieldAction, deleteFieldAction, renameFieldAction } from "@/app/actions/knowledge";
import { Status, fieldClass } from "@/components/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeadlineField } from "@/components/deadline-field";

// Trùng MIN_PASSWORD_LENGTH ở lib/password.ts (file đó dùng node:crypto nên không import vào bundle trình duyệt)
const MIN_PASSWORD_LENGTH = 8;
// Một trường: nhãn → ô nhập → gợi ý, xếp dọc cách nhau 8px. Giữa các trường cách 20px (gap-y-5 ở form).
const label = "flex flex-col gap-2 text-sm";
const labelText = "font-medium";
const hint = "text-xs text-muted-foreground";
// Ô nhập / nút cao 40px trên màn cảm ứng
const touch = "max-md:h-10";

/** Tên hiển thị + hạn / nhãn thẻ đếm ngược. Hạn để trống → ẩn thẻ. Email chỉ đọc (đổi email nhờ Trung). */
export function ProfileForm({ email, name, targetDate, targetLabel }: { email: string | null; name: string; targetDate: string; targetLabel: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfileAction, {});
  const [date, setDate] = useState(targetDate);
  return (
    <form action={action} className="grid gap-x-4 gap-y-5 md:grid-cols-2">
      <label className={`${label} md:col-span-2`}>
        <span className={labelText}>Email đăng nhập</span>
        <Input value={email ?? "(chưa gắn email)"} readOnly aria-readonly="true" className={`${touch} bg-surface-muted text-muted-foreground dark:bg-surface-muted`} />
      </label>
      <label className={`${label} md:col-span-2`}>
        <span className={labelText}>Tên hiển thị</span>
        <Input name="name" defaultValue={name} maxLength={60} required autoComplete="name" className={touch} />
        <span className={hint}>Từ cuối của tên dùng trong lời chào (vd. “Anh Trung” → “Chào buổi sáng, Trung”).</span>
      </label>
      {/* Lịch chọn ngày của app (dd/mm/yyyy) thay <input type="date"> hiện theo locale trình duyệt — rà soát 11/2026 P2 */}
      <div className={label}>
        <span className={labelText}>Hạn cần nhớ (đếm ngược)</span>
        <DeadlineField name="targetDate" label="Hạn" value={date} onChange={setDate} triggerClass={`${fieldClass} ${touch} justify-between text-left`} />
        <span className={hint}>Để trống nếu không cần thẻ đếm ngược.</span>
      </div>
      <label className={label}>
        <span className={labelText}>Tên của hạn đó</span>
        <Input name="targetLabel" defaultValue={targetLabel} maxLength={40} placeholder="vd. hạn nộp đồ án" className={touch} />
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Status state={state} />
        <Button type="submit" disabled={pending} className={`ml-auto ${touch}`}>
          {pending ? "Đang lưu…" : "Lưu"}
        </Button>
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
    <form action={action} className="grid gap-x-4 gap-y-5 md:grid-cols-3">
      <label className={label}>
        <span className={labelText}>Mật khẩu hiện tại</span>
        <Input name="current" type="password" required autoComplete="current-password" value={v.current} onChange={set("current")} className={touch} />
      </label>
      <label className={label}>
        <span className={labelText}>Mật khẩu mới</span>
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
          className={touch}
        />
        <span id="pw-next-hint" className={short ? "text-xs text-danger" : hint}>
          Tối thiểu {MIN_PASSWORD_LENGTH} ký tự{short ? ` (mới ${v.next.length})` : ""}.
        </span>
      </label>
      <label className={label}>
        <span className={labelText}>Nhập lại mật khẩu mới</span>
        <Input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={v.confirm}
          onChange={set("confirm")}
          aria-invalid={mismatch || undefined}
          aria-describedby="pw-confirm-hint"
          className={touch}
        />
        <span id="pw-confirm-hint" role={mismatch ? "alert" : undefined} className="text-xs text-danger empty:hidden">
          {mismatch ? "Chưa khớp với mật khẩu mới." : ""}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-3">
        <Status state={state} />
        <Button type="submit" className={`ml-auto ${touch}`} disabled={pending || short || mismatch}>
          {pending ? "Đang đổi…" : "Đổi mật khẩu"}
        </Button>
      </div>
    </form>
  );
}

type ListState = { ok?: boolean; message?: string };
type ListItem = { id: string; name: string; count: number };

/**
 * Danh sách tên của riêng mình: thêm, đổi tên tại chỗ, xoá khi không còn mục nào gắn.
 * Dùng cho Dự án (SPEC.md mục 5.5) và Lĩnh vực (mục 5.6).
 */
function NameListManager({
  items,
  noun,
  countNoun,
  emptyText,
  colored = true,
  createAction,
  renameAction,
  deleteAction,
}: {
  items: ListItem[];
  /** "dự án" / "lĩnh vực" */
  noun: string;
  /** "việc" / "ghi chú" */
  countNoun: string;
  emptyText: string;
  /** 4 mục đầu có màu riêng (docs/decisions/0003) */
  colored?: boolean;
  createAction: (prev: ListState, form: FormData) => Promise<ListState>;
  renameAction: (id: string, name: string) => Promise<ListState>;
  deleteAction: (id: string) => Promise<ListState>;
}) {
  const [state, action, pending] = useActionState<ListState, FormData>(createAction, {});
  const [note, setNote] = useState<ListState>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, startTransition] = useTransition();

  const run = (fn: () => Promise<ListState>) =>
    startTransition(async () => {
      setNote(await fn());
    });

  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap gap-2" key={state.ok ? `ok-${state.message}` : "form"}>
        <Input name="name" aria-label={`Tên ${noun} mới`} placeholder={`Thêm ${noun}…`} maxLength={40} autoComplete="off" className={`${touch} min-w-48 flex-1`} />
        <Button type="submit" disabled={pending} className={touch}>
          {pending ? "Đang thêm…" : "Thêm"}
        </Button>
      </form>
      <Status state={note.message ? note : state} />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {items.map((p, i) => (
            <li key={p.id} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              {colored && (
                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: `var(${i < 4 ? `--field-${i + 1}` : "--field-neutral"})` }} />
              )}
              {editing === p.id ? (
                <form
                  className="flex min-w-0 flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      const res = await renameAction(p.id, draft);
                      if (res.ok) setEditing(null);
                      return res;
                    });
                  }}
                >
                  <Input
                    autoFocus
                    aria-label={`Đổi tên ${noun} ${p.name}`}
                    value={draft}
                    maxLength={40}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                    className={touch}
                  />
                  <Button type="submit" disabled={busy} className={touch}>
                    Lưu
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)} className={touch}>
                    Hủy
                  </Button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {p.count} {countNoun}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(p.id);
                      setDraft(p.name);
                      setNote({});
                    }}
                    aria-label={`Đổi tên ${noun} ${p.name}`}
                    className={`${touch} text-muted-foreground`}
                  >
                    Đổi tên
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy || p.count > 0}
                    title={p.count > 0 ? `Còn ${countNoun} trong ${noun} này` : undefined}
                    aria-label={p.count > 0 ? `Xóa ${noun} ${p.name} (còn ${p.count} ${countNoun} nên chưa xóa được)` : `Xóa ${noun} ${p.name}`}
                    onClick={() => run(() => deleteAction(p.id))}
                    className={`${touch} text-danger hover:bg-danger-soft hover:text-danger`}
                  >
                    Xóa
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Dự án của riêng mình: xoá chỉ khi không còn việc. */
export function ProjectManager({ projects }: { projects: { id: string; name: string; tasks: number }[] }) {
  return (
    <NameListManager
      items={projects.map((p) => ({ id: p.id, name: p.name, count: p.tasks }))}
      noun="dự án"
      countNoun="việc"
      emptyText="Chưa có dự án nào. Thêm một dự án để nhóm việc ở Tasks."
      createAction={createProjectAction}
      renameAction={renameProjectAction}
      deleteAction={deleteProjectAction}
    />
  );
}

/** Lĩnh vực của ghi chú kiến thức (SPEC.md mục 5.6): xoá chỉ khi không còn ghi chú. */
export function FieldManager({ fields }: { fields: { id: string; name: string; notes: number }[] }) {
  return (
    <NameListManager
      items={fields.map((f) => ({ id: f.id, name: f.name, count: f.notes }))}
      noun="lĩnh vực"
      countNoun="ghi chú"
      emptyText="Chưa có lĩnh vực nào. Thêm lĩnh vực để nhóm ghi chú ở Knowledge."
      createAction={createFieldAction}
      renameAction={renameFieldAction}
      deleteAction={deleteFieldAction}
    />
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
      <form action={action} className="mt-3 grid gap-x-4 gap-y-5 md:grid-cols-2">
        <p className="text-sm text-muted-foreground md:col-span-2">
          Xoá vĩnh viễn tài khoản và <strong className="font-medium text-foreground">toàn bộ</strong> việc, mục tiêu, thói quen, nhật ký của bạn.
          Không hoàn tác được.
        </p>
        <label className={label}>
          <span className={labelText}>Gõ lại email để xác nhận</span>
          <Input name="email" type="email" required autoComplete="off" placeholder="email của bạn" className={touch} />
        </label>
        <label className={label}>
          <span className={labelText}>Mật khẩu</span>
          <Input name="password" type="password" required autoComplete="current-password" className={touch} />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Status state={state} />
          {/* Nút "nguy hiểm" của thư viện: chữ đỏ trên nền đỏ nhạt, đủ tương phản ở cả hai theme (rà soát A3: 2,3:1 ở nền tối) */}
          <Button type="submit" variant="destructive" className={`ml-auto ${touch}`} disabled={pending}>
            {pending ? "Đang xoá…" : "Xoá tài khoản vĩnh viễn"}
          </Button>
        </div>
      </form>
    </details>
  );
}
