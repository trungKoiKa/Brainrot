"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { GraphData } from "@/lib/graph-types";

// three.js chỉ chạy được trên trình duyệt → không render phía server; chỉ trang /brain tải gói này (SPEC.md mục 5.7)
const BrainGraph = dynamic(() => import("./brain-graph"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted-foreground">Đang dựng graph…</p>,
});

/**
 * BẢN THỬ (12/11/2026): 5 kiểu nền cho khung Brain để Trung chọn, xem bằng `/brain?bg=space|nebula|dots|spot|dawn`.
 * `dark: true` = khung luôn tối ở cả hai theme. Chọn xong thì giữ một kiểu, bỏ tham số `bg`.
 */
const BACKGROUNDS: Record<string, { className: string; dark?: boolean }> = {
  flat: { className: "bg-background" },
  space: { className: "brain-bg-space", dark: true },
  nebula: { className: "brain-bg-nebula", dark: true },
  dots: { className: "brain-bg-dots" },
  spot: { className: "brain-bg-spot" },
  dawn: { className: "brain-bg-dawn" },
};

/** Khung graph 3D. `className` đặt chiều cao khung. Trang gọi chỉ dựng khi đã có ít nhất một ghi chú hoặc việc. */
export function BrainView({ data, className = "h-[calc(100dvh-13rem)] min-h-96" }: { data: GraphData; className?: string }) {
  const bg = BACKGROUNDS[useSearchParams().get("bg") ?? ""] ?? BACKGROUNDS.flat;
  return (
    <div
      data-brain-frame
      data-theme={bg.dark ? "dark" : undefined}
      className={`relative overflow-hidden rounded-xl border border-line text-foreground ${bg.className} ${className}`}
    >
      <BrainGraph data={data} />
    </div>
  );
}
