"use client";

import dynamic from "next/dynamic";
import type { GraphData } from "@/lib/graph-types";

// three.js chỉ chạy được trên trình duyệt → không render phía server; chỉ trang /brain tải gói này (SPEC.md mục 5.7)
const BrainGraph = dynamic(() => import("./brain-graph"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted-foreground">Đang dựng graph…</p>,
});

/** Khung graph 3D. `className` đặt chiều cao khung. Trang gọi chỉ dựng khi đã có ít nhất một ghi chú hoặc việc. */
export function BrainView({ data, className = "h-[calc(100dvh-13rem)] min-h-96" }: { data: GraphData; className?: string }) {
  return (
    <div className={`relative overflow-hidden border border-line bg-background ${className}`}>
      <BrainGraph data={data} />
    </div>
  );
}
