// Màu cố định theo CHỦ ĐỀ — dùng chung cho Lĩnh vực (Knowledge) và Dự án (Tasks). Xem docs/decisions/0003.
//
// Chỉ có 4 slot màu phân biệt được chắc chắn ở cả 2 theme (đã kiểm bằng validator dataviz).
// Cùng một slot = cùng chủ đề ở mọi nơi (vd. vàng = đồ án, xanh dương = học AI/thị giác máy).
// Giá trị không có trong bảng (kể cả giá trị mới thêm trong Notion) → xám trung tính.
// Muốn đổi: sửa bảng dưới, KHÔNG thêm slot thứ 5 (sẽ trùng màu).
type Slot = 1 | 2 | 3 | 4;

const FIELD_SLOTS: Record<string, Slot> = {
  "Computer Vision": 1,
  "AI Agent": 2,
  "Embedded/Edge AI": 3,
  "Đồ án": 4,
};

const PROJECT_SLOTS: Record<string, Slot> = {
  "Học AI": 1,
  "Sản phẩm": 2,
  "Thực tập": 3,
  "Đồ án": 4,
};

const toVar = (slot: Slot | undefined) => (slot ? `--field-${slot}` : "--field-neutral");

export function fieldColorVar(field: string | null): string {
  return toVar(field ? FIELD_SLOTS[field] : undefined);
}

export function projectColorVar(project: string | null): string {
  return toVar(project ? PROJECT_SLOTS[project] : undefined);
}
