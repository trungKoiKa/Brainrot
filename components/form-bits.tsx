// Kiểu viền giống `Input` cho hai thứ chưa có component thư viện trong repo: nút mở lịch (`DeadlineField`) và ô chọn
// gốc của trình duyệt (`<select>`). Ô nhập và nút dùng `Input` / `Button` của components/ui.
export const fieldClass =
  "w-full min-h-9 rounded-lg border border-input bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

/** `<select>` gốc: rộng theo nội dung, mũi tên riêng theo theme (`select-chevron` trong app/globals.css). */
export const selectClass = `${fieldClass.replace("w-full", "w-auto")} select-chevron pr-8`;

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
