"use client";

import dynamic from "next/dynamic";

// Ô Planner nằm trong localStorage → chỉ render ở trình duyệt, tránh lệch giữa server và client
export const WeekCardsClient = dynamic(() => import("./week-cards").then((m) => m.WeekCards), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded-2xl border border-line bg-surface" />,
});
