"use client";

import dynamic from "next/dynamic";
import type { GraphData } from "@/lib/graph/types";

// three.js chỉ chạy được trên trình duyệt → không render phía server; chỉ trang /brain tải gói này (SPEC.md mục 5.7)
const BrainGraph = dynamic(() => import("./brain-graph"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted-foreground">Đang dựng graph…</p>,
});

/**
 * Khung graph 3D. `className` đặt chiều cao khung. Trang gọi chỉ dựng khi đã có ít nhất một ghi chú hoặc việc.
 * Nền "Tinh vân" (Trung chọn 12/11/2026 trong 5 kiểu): **luôn tối ở cả hai theme** để neuron phát sáng rõ. Khung mang
 * `data-theme="dark"` nên mọi token bên trong (ô tìm, chip chú thích, màu graph) là token tối; canvas three.js trong suốt.
 */
export function BrainView({ data, className = "h-[calc(100dvh-13rem)] min-h-96" }: { data: GraphData; className?: string }) {
  return (
    <div data-brain-frame data-theme="dark" className={`brain-bg-nebula relative overflow-hidden rounded-xl border border-line text-foreground ${className}`}>
      <BrainGraph data={data} />
    </div>
  );
}
