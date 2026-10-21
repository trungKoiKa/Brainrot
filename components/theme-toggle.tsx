"use client";

import { useLayoutEffect } from "react";
import { readStoredTheme, storeTheme, systemTheme, type Theme } from "@/lib/theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  // Ở dev, Strict Mode remount làm mất data-theme do script đặt → đặt lại trước khi vẽ.
  // Ở production đây là no-op.
  useLayoutEffect(() => {
    applyTheme(readStoredTheme() ?? systemTheme());
  }, []);

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next: Theme = current === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi giao diện sáng/tối"
      title="Đổi giao diện sáng/tối"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      {/* Icon chọn bằng CSS theo data-theme → không lệch giữa server và client */}
      <svg viewBox="0 0 24 24" className="size-4 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden size-4 dark:block" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* Mobile chỉ hiện icon cho gọn thanh trên */}
      <span className="hidden md:inline">
        <span className="dark:hidden">Giao diện tối</span>
        <span className="hidden dark:inline">Giao diện sáng</span>
      </span>
    </button>
  );
}
