// Màu của Dự án (Tasks) và Lĩnh vực (Knowledge). Xem docs/decisions/0003.
//
// Chỉ có 4 slot màu phân biệt được chắc chắn ở cả 2 theme (đã kiểm bằng validator dataviz): `--field-1..4`.
// Màu gán theo THỨ TỰ trong danh sách của từng người (Cài đặt): 4 mục đầu có màu, còn lại xám `--field-neutral`.
// KHÔNG thêm slot thứ 5 (sẽ trùng màu).

/** Tên CSS variable màu của `name` trong danh sách `list`; không có tên / không tìm thấy / từ mục thứ 5 → xám. */
export function colorVarByOrder(name: string | null, list: readonly string[]): string {
  const i = name ? list.indexOf(name) : -1;
  return i >= 0 && i < 4 ? `--field-${i + 1}` : "--field-neutral";
}
