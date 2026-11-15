import { toast } from "sonner";

/** Toast "Hoàn tác" hiện 8 giây (SPEC.md mục 6); sonner tạm dừng khi rê chuột / focus và xếp chồng nhiều toast. */
export const UNDO_MS = 8000;

/** Báo một thao tác vừa làm kèm nút "Hoàn tác". Không có `onUndo` thì chỉ báo (vẫn giữ 8 giây cho đồng bộ). */
export function undoToast(message: string, onUndo?: () => void) {
  return toast(message, { duration: UNDO_MS, action: onUndo ? { label: "Hoàn tác", onClick: onUndo } : undefined });
}
