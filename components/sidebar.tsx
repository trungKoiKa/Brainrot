"use client";
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Second Brain" render={<Link href="/" />}>
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
              >
                <BrainIcon className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:sr-only">
                <span className="truncate font-serif text-base font-semibold">Second Brain</span>

              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent role="navigation" aria-label="Điều hướng chính">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} aria-current={active ? "page" : undefined} />}
                      isActive={active}
                      tooltip={label}
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
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
