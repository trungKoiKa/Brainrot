"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/tasks", label: "Tasks" },
  { href: "/brain", label: "Brain" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-surface px-4 py-2 md:h-screen md:w-60 md:shrink-0 md:flex-col md:items-stretch md:gap-1 md:border-r md:border-b-0 md:px-4 md:py-6">
      <Link href="/" className="mr-auto whitespace-nowrap font-serif text-lg font-semibold md:mr-0 md:mb-6 md:px-3 md:text-xl">
        Second Brain
      </Link>

      <nav className="flex gap-1 md:flex-col">
        {NAV.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="md:mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  );
}
