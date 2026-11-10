// Tạm giữ cho phần chưa dựng lại; code mới dùng Input/Textarea/Select/Button của components/ui (redesign 11/2026).
export const fieldClass =
  "w-full rounded-sm border border-input bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

export const primaryButtonClass =
  "shrink-0 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";

export type FormStatus = { ok?: boolean; message?: string };

/** Dòng báo kết quả sau khi gửi form: thành công màu nhạt, lỗi màu đỏ. */
export function Status({ state }: { state: FormStatus }) {
  if (!state.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-muted-foreground" : "text-danger"}`}>
      {state.ok ? "✓ " : ""}
      {state.message}
    </p>
  );
}
