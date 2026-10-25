"use client";

import dynamic from "next/dynamic";
import type { DashInput } from "@/lib/dashboard/stats";

// Planner (localStorage) + recharts → chỉ render ở trình duyệt, tránh lệch giữa server và client
const DashboardView = dynamic(() => import("./dashboard-view").then((m) => m.DashboardView), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />,
});

export function DashboardClient({ real }: { real: Omit<DashInput, "planner"> }) {
  return <DashboardView real={real} />;
}
