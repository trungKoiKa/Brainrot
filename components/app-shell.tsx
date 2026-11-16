"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
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

export function AppShell({ account, children }: { account?: React.ReactNode; children: React.ReactNode }) {
  const open = useSyncExternalStore(subscribe, readOpen, () => true);
  const pathname = usePathname();
  const current = NAV.find((n) => isActive(n.href, pathname));

  return (
    <TooltipProvider>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <AppSidebar account={account} />
        <SidebarInset className="graph-paper min-w-0">
          {/* Bỏ qua các mục thanh bên, nhảy thẳng vào nội dung (rà soát A3) */}
          <a
            href="#noi-dung"
            className="sr-only z-50 bg-surface px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            Bỏ qua, tới nội dung
          </a>
          <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-background/90 px-4 backdrop-blur md:px-6">
            <SidebarTrigger aria-label="Thu/mở thanh bên" />
            <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-center" />
            <span className="truncate text-sm font-medium" lang={current ? "en" : undefined}>
              {current?.label ?? (pathname.startsWith("/settings") ? "Cài đặt" : "Brainrot")}
            </span>
          </header>
          {/* Một bề rộng nội dung cho mọi trang (rà soát A1 mục 10) */}
          <main id="noi-dung" tabIndex={-1} className="w-full flex-1 px-4 py-6 outline-none md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
          {/* closeButton: nút ✕ để tắt toast sớm, không phải chờ hết 8 giây (Trung yêu cầu 17/11/2026) */}
          <Toaster position="bottom-center" containerAriaLabel="Thông báo" closeButton />

        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
