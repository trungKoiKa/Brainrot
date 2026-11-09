"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { logoutAction } from "@/app/actions/account";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { daysBetween, longDateVN, todayVN } from "@/lib/date";
import { isActive } from "./sidebar";

// Ngày lấy ở trình duyệt (layout có thể được prerender từ lúc build). Server trả null → chỉ hiện sau khi hydrate.
const noSubscribe = () => () => {};
const useToday = () => useSyncExternalStore(noSubscribe, () => todayVN(), () => null);

function DateInfo({ target }: { target: { date: string; label: string } | null }) {
  const today = useToday();
  if (!today) return null;
  const left = target ? daysBetween(today, target.date) : null;
  return (
    <div className="space-y-0.5 px-2 pb-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
      <p className="font-medium text-foreground">{longDateVN()}</p>
      {target && left !== null && left > 0 && (
        <p>
          {target.label.charAt(0).toUpperCase() + target.label.slice(1)}: còn <span className="font-medium text-primary">{left} ngày</span>
        </p>
      )}
      {target && left === 0 && <p className="font-medium text-primary">Hôm nay là {target.label}</p>}
    </div>
  );
}

/** Chân sidebar của từng người: ngày + đếm ngược, tên, Cài đặt, Đăng xuất (SPEC-v1.0 bước 5). */
export function SidebarAccount({ name, target }: { name: string; target: { date: string; label: string } | null }) {
  const pathname = usePathname();
  return (
    <>
      {/* Today đã có ngày + đếm ngược ở dòng phụ dưới lời chào → không lặp ở đây */}
      {!isActive("/today", pathname) && <DateInfo target={target} />}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/settings" aria-current={isActive("/settings", pathname) ? "page" : undefined} />}
            isActive={isActive("/settings", pathname)}
            tooltip="Cài đặt"
          >
            <SettingsIcon aria-hidden="true" />
            <span className="min-w-0 truncate">{name || "Cài đặt"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <form action={logoutAction}>
            <SidebarMenuButton type="submit" tooltip="Đăng xuất">
              <LogOutIcon aria-hidden="true" />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </form>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
