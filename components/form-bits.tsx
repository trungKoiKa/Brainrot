export const fieldClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

export const primaryButtonClass =
  "shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface disabled:opacity-50";

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
