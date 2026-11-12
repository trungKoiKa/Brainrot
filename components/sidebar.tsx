"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  BrainIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SettingsIcon,
  SunIcon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { ThemeToggle } from "./theme-toggle";

// Dashboard đứng đầu (Trung chốt 26/10/2026); `/` chuyển sang Today. Knowledge và Brain thêm ở v1.1 (SPEC.md mục 10)
export const NAV: readonly { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/today", label: "Today", icon: SunIcon },
  { href: "/tasks", label: "Tasks", icon: ListChecksIcon },
  { href: "/goals", label: "Goal", icon: TargetIcon },
  { href: "/knowledge", label: "Knowledge", icon: BookOpenIcon },
  { href: "/brain", label: "Brain", icon: BrainIcon },
];

export const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/**
 * Thanh bên kiểu "nhật ký kỹ thuật" như phương án C (Trung chọn 11/11/2026): danh sách vuông kẻ dòng, số 01–07 mono bên
 * trái, ô cam nhỏ ở mục đang chọn, không icon. Desktop thu/mở hẳn (offcanvas); mobile mở dạng ngăn kéo.
 */
export function AppSidebar({ account }: { account?: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  // Mobile: đổi trang thì đóng ngăn kéo (rà soát A3 mục 1)
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);
  const items = [...NAV, { href: "/settings", label: "Cài đặt", icon: SettingsIcon }];

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <Link href="/" className="block px-4 py-4 font-mono text-sm font-semibold tracking-wide">
          BRAINROT/v1
        </Link>
      </SidebarHeader>

      <SidebarContent role="navigation" aria-label="Điều hướng chính" className="gap-0">
        <ul>
          {items.map(({ href, label }, i) => {
            const active = isActive(href, pathname);
            return (
              <li key={href} className="border-b border-sidebar-border">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-sidebar-accent ${
                    active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span aria-hidden="true" className="w-5 font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span lang={href === "/settings" ? undefined : "en"} className="flex-1">
                    {label}
                  </span>
                  {active && <span aria-hidden="true" className="size-1.5 bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </SidebarContent>

      <SidebarFooter>
        {account}
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
