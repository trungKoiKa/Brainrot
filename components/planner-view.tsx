"use client";

import dynamic from "next/dynamic";

// Dữ liệu planner nằm trong localStorage → chỉ render phía client, tránh lệch giữa server và trình duyệt
const PlannerApp = dynamic(() => import("@/features/planner/App"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted-foreground">Đang mở planner…</p>,
});

export function PlannerView() {
  return <PlannerApp />;
}
