/** Trang mặc định sau khi đăng nhập (đi thẳng, không qua "/" — rà soát A4). */
export const HOME_PATH = "/today";

/**
 * Đường dẫn quay lại sau khi đăng nhập (rà soát A2 lỗi 4). Chỉ nhận đường dẫn tương đối trong app, để không bị lợi dụng
 * chuyển hướng sang trang khác (open redirect): phải bắt đầu bằng "/", không phải "//" hay "/\", không về /login.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return HOME_PATH;
  if (next === "/" || next.startsWith("/login")) return HOME_PATH;
  return next;
}
