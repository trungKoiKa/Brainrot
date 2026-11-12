"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import type { DashInput } from "@/lib/dashboard/stats";

// Lựa chọn Thật/Mẫu + kỳ lưu ở localStorage, biểu đồ đo bề rộng khung → chỉ render ở trình duyệt, tránh lệch server / client
const DashboardView = dynamic(() => import("./dashboard-view").then((m) => m.DashboardView), {
  ssr: false,
  loading: () => <Skeleton className="h-96 rounded-xl" />,
});

export function DashboardClient({ real }: { real: DashInput }) {
  return <DashboardView real={real} />;
}
