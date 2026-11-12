// Xử lý chữ dùng chung (tìm không dấu ở Brain, Knowledge, ô gắn việc của Goal). Hàm thuần.

/** Bỏ dấu tiếng Việt + chữ thường: "Đồ án" → "do an". */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
