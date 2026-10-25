"use client";

import dynamic from "next/dynamic";
import type { DashInput } from "@/lib/dashboard/stats";
import type { GraphData } from "@/lib/graph-types";

// Planner (localStorage) + recharts → chỉ render ở trình duyệt, tránh lệch giữa server và client
const DashboardView = dynamic(() => import("./dashboard-view").then((m) => m.DashboardView), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />,
});

export function DashboardClient({ real, graph }: { real: Omit<DashInput, "planner">; graph: GraphData }) {
  return <DashboardView real={real} graph={graph} />;
}
