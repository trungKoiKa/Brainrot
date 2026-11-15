// Đọc / ghi localStorage an toàn: trình duyệt chặn lưu trữ (chế độ riêng tư…) hoặc dữ liệu hỏng thì bỏ qua,
// app vẫn chạy, chỉ không nhớ được giữa các lần mở. Chỉ gọi ở trình duyệt (trong effect hoặc sự kiện).

/** Đọc JSON rồi kiểm tra dạng bằng `check` (trả null nếu không đúng dạng). */
export function readJson<T>(key: string, check: (v: unknown) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? check(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Ghi JSON; `null` = xoá khoá. */
export function writeJson(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // bị chặn → chỉ nhớ trong phiên
  }
}

/** Đọc một lựa chọn đã lưu, chỉ nhận giá trị nằm trong `allowed`. */
export function readChoice<T>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return allowed.find((a) => String(a) === raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeChoice(key: string, value: string | number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // bị chặn → chỉ nhớ trong phiên
  }
}
