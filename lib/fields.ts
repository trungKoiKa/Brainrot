// Màu cố định cho Lĩnh vực — dùng chung cho badge (Today), node + chip (Brain). Xem docs/decisions/0003.
//
// Chỉ có 4 slot màu phân biệt được chắc chắn ở cả 2 theme (đã kiểm bằng validator dataviz).
// Lĩnh vực không có trong bảng (kể cả lĩnh vực mới thêm trong Notion) → xám trung tính.
// Muốn đổi lĩnh vực được tô màu: sửa bảng dưới, KHÔNG thêm slot thứ 5 (sẽ trùng màu).
const FIELD_SLOTS: Record<string, 1 | 2 | 3 | 4> = {
  "Computer Vision": 1,
  "AI Agent": 2,
  "Embedded/Edge AI": 3,
  "Đồ án": 4,
};

export function fieldColorVar(field: string | null): string {
  const slot = field ? FIELD_SLOTS[field] : undefined;
  return slot ? `--field-${slot}` : "--field-neutral";
}
