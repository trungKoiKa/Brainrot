export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/**
 * Chạy đồng bộ trong <head>: lấy lựa chọn đã lưu, nếu không có thì theo hệ điều hành.
 * Giữ ES5 thuần vì chạy trước khi bundle được nạp.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function readStoredTheme(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage bị chặn (chế độ riêng tư…) → chỉ đổi trong phiên hiện tại
  }
}

export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
