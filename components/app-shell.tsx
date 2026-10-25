"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar, isActive, NAV } from "./sidebar";

// Trạng thái thu/mở nhớ trong cookie `sidebar_state` (SidebarProvider tự ghi).
// Đọc ở trình duyệt; server coi như đang mở → người đã thu gọn thấy mở trong tích tắc rồi thu lại.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const readOpen = () => !document.cookie.split("; ").includes("sidebar_state=false");

function setOpen(open: boolean) {
  document.cookie = `sidebar_state=${open}; path=/; max-age=${60 * 60 * 24 * 365}`;
  listeners.forEach((l) => l());
}

export function AppShell({ thesisDeadline, children }: { thesisDeadline?: string; children: React.ReactNode }) {
  const open = useSyncExternalStore(subscribe, readOpen, () => true);
  const pathname = usePathname();
  const current = NAV.find((n) => isActive(n.href, pathname));

  return (
    <TooltipProvider>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <AppSidebar thesisDeadline={thesisDeadline} />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-background/85 px-4 backdrop-blur md:px-6">
            <SidebarTrigger aria-label="Thu/mở thanh bên" />
            <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-center" />
            <span className="truncate text-sm font-medium">{current?.label ?? "Second Brain"}</span>
          </header>
          <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
