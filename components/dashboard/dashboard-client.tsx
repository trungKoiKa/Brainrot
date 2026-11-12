"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import type { DashInput } from "@/lib/dashboard/stats";

// recharts + lựa chọn Thật/Mẫu lưu ở localStorage → chỉ render ở trình duyệt, tránh lệch giữa server và client
const DashboardView = dynamic(() => import("./dashboard-view").then((m) => m.DashboardView), {
  ssr: false,
  loading: () => <Skeleton className="h-96 rounded-xl" />,
});

export function DashboardClient({ real }: { real: DashInput }) {
  return <DashboardView real={real} />;
}
