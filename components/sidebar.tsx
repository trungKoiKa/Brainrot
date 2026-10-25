"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRangeIcon, LayoutDashboardIcon, ListChecksIcon, NetworkIcon, SunIcon, type LucideIcon } from "lucide-react";
import { daysBetween, longDateVN, todayVN } from "@/lib/date";
import { ThemeToggle } from "./theme-toggle";

// Brain là trang chủ (SPEC-v0.2 mục 2); Dashboard ngay sau Brain (SPEC-v0.3 mục 3)
const NAV: readonly { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Brain", icon: NetworkIcon },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/today", label: "Today", icon: SunIcon },
  { href: "/tasks", label: "Tasks", icon: ListChecksIcon },
  { href: "/planner", label: "Planner", icon: CalendarRangeIcon },
];

// Ngày lấy ở trình duyệt (layout có thể được prerender từ lúc build → ngày trên server sẽ cũ).
// Server trả null → chân sidebar chỉ hiện sau khi hydrate, không lệch HTML.
const noSubscribe = () => () => {};
const useToday = () => useSyncExternalStore(noSubscribe, () => todayVN(), () => null);

function TodayInfo({ thesisDeadline }: { thesisDeadline?: string }) {
  const today = useToday();
  if (!today) return null;
  const left = thesisDeadline ? daysBetween(today, thesisDeadline) : null;
  return (
    <div className="space-y-0.5 px-3 text-xs text-muted-foreground">
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

export function Sidebar({ thesisDeadline }: { thesisDeadline?: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-surface px-4 py-2 md:h-screen md:w-60 md:shrink-0 md:flex-col md:items-stretch md:gap-1 md:border-r md:border-b-0 md:px-4 md:py-6">
      <Link href="/" className="mr-auto whitespace-nowrap font-serif text-lg font-semibold md:mr-0 md:mb-6 md:px-3 md:text-xl">
        Second Brain
      </Link>

      <nav className="flex gap-1 md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={label}
              className={`relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors md:px-3 ${
                active
                  ? "bg-accent-soft font-medium text-primary md:before:absolute md:before:inset-y-1.5 md:before:-left-4 md:before:w-1 md:before:rounded-r-full md:before:bg-primary"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {/* Mobile: chỉ icon cho gọn thanh trên */}
              <span className="sr-only md:not-sr-only">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="md:mt-auto md:space-y-3 md:border-t md:border-line md:pt-4">
        <div className="hidden md:block">
          <TodayInfo thesisDeadline={thesisDeadline} />
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
