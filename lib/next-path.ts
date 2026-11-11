/** Trang mặc định sau khi đăng nhập (đi thẳng, không qua "/" — rà soát A4). */
export const HOME_PATH = "/today";

const BASE = "http://app.invalid";

/**
 * Đường dẫn quay lại sau khi đăng nhập (rà soát A2 lỗi 4). Chỉ nhận đường dẫn tương đối trong app, để không bị lợi dụng
 * chuyển hướng sang trang khác (open redirect): không có ký tự điều khiển/khoảng trắng (trình duyệt bỏ tab/xuống dòng nên
 * "/\t/evil.com" thành "//evil.com" — rà soát cuối A2 N2), và khi phân tích URL vẫn ở cùng gốc. Không về /login.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || next.length > 512 || !next.startsWith("/")) return HOME_PATH;
  if (/[\u0000-\u0020\u007f\\]/.test(next) || next.startsWith("//")) return HOME_PATH;
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return HOME_PATH;
  }
  if (url.origin !== BASE) return HOME_PATH;
  const path = url.pathname + url.search;
  if (path === "/" || path.startsWith("/login")) return HOME_PATH;
  return path;
}
