"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SunIcon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { ThemeToggle } from "./theme-toggle";

// Dashboard đứng đầu (Trung chốt 26/10/2026); Brain tạm ẩn ở v1.0 (SPEC-v1.0 mục 7), `/` chuyển sang Today
export const NAV: readonly { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/today", label: "Today", icon: SunIcon },
  { href: "/tasks", label: "Tasks", icon: ListChecksIcon },
  { href: "/goals", label: "Goal", icon: TargetIcon },
];

export const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/** Thanh bên theo mẫu ReUI c-sidebar-2 (Icon Rail): thu gọn còn cột icon, mobile mở dạng ngăn kéo. */
export function AppSidebar({ account }: { account?: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  // Mobile: đổi trang thì đóng ngăn kéo (rà soát A3 mục 1)
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={isMobile ? undefined : "Brainrot"} render={<Link href="/" />}>
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground"
              >
                <BrainIcon className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:sr-only">
                <span className="truncate font-mono text-sm font-semibold tracking-wide">BRAINROT</span>

              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent role="navigation" aria-label="Điều hướng chính">
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono">TRANG</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon: Icon }, i) => {
                const active = isActive(href, pathname);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} aria-current={active ? "page" : undefined} />}
                      isActive={active}
                      tooltip={isMobile ? undefined : label}
                    >
                      <Icon aria-hidden="true" />
                      <span lang="en" className="flex-1">
                        {label}
                      </span>
                      <span aria-hidden="true" className="font-mono text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                        0{i + 1}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>

        {account}
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Dải kéo ở mép để thu/mở bằng chuột; bàn phím dùng nút ở thanh trên hoặc Ctrl+B */}
      <SidebarRail />
    </Sidebar>
  );
}
