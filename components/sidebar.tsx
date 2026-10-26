"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainIcon,
  CalendarRangeIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  NetworkIcon,
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
import { daysBetween, longDateVN, todayVN } from "@/lib/date";
import { ThemeToggle } from "./theme-toggle";

// Dashboard đứng đầu (Trung chốt 26/10/2026); trang chủ `/` vẫn là Brain (SPEC-v0.2 mục 2)
export const NAV: readonly { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/", label: "Brain", icon: NetworkIcon },
  { href: "/today", label: "Today", icon: SunIcon },
  { href: "/tasks", label: "Tasks", icon: ListChecksIcon },
  { href: "/goals", label: "Goal", icon: TargetIcon },
  { href: "/planner", label: "Planner", icon: CalendarRangeIcon },
];

export const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

// Ngày lấy ở trình duyệt (layout có thể được prerender từ lúc build → ngày trên server sẽ cũ).
// Server trả null → chân sidebar chỉ hiện sau khi hydrate, không lệch HTML.
const noSubscribe = () => () => {};
const useToday = () => useSyncExternalStore(noSubscribe, () => todayVN(), () => null);

function TodayInfo({ thesisDeadline }: { thesisDeadline?: string }) {
  const today = useToday();
  if (!today) return null;
  const left = thesisDeadline ? daysBetween(today, thesisDeadline) : null;
  return (
    <div className="space-y-0.5 px-2 pb-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
      <p className="font-medium text-foreground">{longDateVN()}</p>
      {left !== null && left > 0 && (
        <p>
          Đồ án: còn <span className="font-medium text-primary">{left} ngày</span>
        </p>
      )}
      {left === 0 && <p className="font-medium text-primary">Hôm nay nộp đồ án</p>}
    </div>
  );
}

/** Thanh bên theo mẫu ReUI c-sidebar-2 (Icon Rail): thu gọn còn cột icon, mobile mở dạng ngăn kéo. */
export function AppSidebar({ thesisDeadline }: { thesisDeadline?: string }) {
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
                <span className="truncate text-xs text-sidebar-foreground/70">Anh Trung</span>
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
        <TodayInfo thesisDeadline={thesisDeadline} />
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
