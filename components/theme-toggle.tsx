"use client";

import { useLayoutEffect } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { readStoredTheme, storeTheme, systemTheme, type Theme } from "@/lib/theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Nút đổi theme ở chân sidebar (SidebarMenuButton → thu gọn còn icon + tooltip). */
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
    <SidebarMenuButton onClick={toggle} tooltip="Đổi giao diện sáng/tối" aria-label="Đổi giao diện sáng/tối">
      {/* Icon và nhãn chọn bằng CSS theo data-theme → không lệch giữa server và client */}
      <MoonIcon aria-hidden="true" className="dark:hidden" />
      <SunIcon aria-hidden="true" className="hidden dark:block" />
      <span>
        <span className="dark:hidden">Giao diện tối</span>
        <span className="hidden dark:inline">Giao diện sáng</span>
      </span>
    </SidebarMenuButton>
  );
}
