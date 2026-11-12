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
 * Thanh bên (DESIGN.md → Layout): mỗi mục là một dòng bo 8px có số 01–07 bên trái, không kẻ dòng, không icon; mục đang
 * chọn có nền cam nhạt, số cam và chấm cam (bản mềm, Trung chốt 12/11/2026). Desktop thu/mở hẳn (offcanvas); mobile mở
 * dạng ngăn kéo.
 */
export function AppSidebar({ account }: { account?: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  // Mobile: đổi trang thì đóng ngăn kéo (rà soát A3 mục 1)
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);
  const items = [...NAV, { href: "/settings", label: "Cài đặt", icon: SettingsIcon }];

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-0">
        <Link href="/" className="block px-4 pt-4 pb-2 text-sm font-semibold tracking-wide">
          BRAINROT/v1
        </Link>
      </SidebarHeader>

      <SidebarContent role="navigation" aria-label="Điều hướng chính" className="gap-0">
        <ul className="flex flex-col gap-0.5 px-2 py-1">
          {items.map(({ href, label }, i) => {
            const active = isActive(href, pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-9 items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors max-md:min-h-10 ${
                    active ? "bg-accent-soft font-semibold text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                >
                  <span aria-hidden="true" className={`w-5 text-xs tabular-nums ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span lang={href === "/settings" ? undefined : "en"} className="flex-1">
                    {label}
                  </span>
                  {active && <span aria-hidden="true" className="mr-1 size-1.5 rounded-full bg-primary" />}
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
