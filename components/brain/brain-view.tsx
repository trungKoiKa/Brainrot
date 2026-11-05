"use client";

import dynamic from "next/dynamic";
import type { GraphData } from "@/lib/graph-types";

// three.js chỉ chạy được trên trình duyệt → không render phía server (SPEC 7.3)
const BrainGraph = dynamic(() => import("./brain-graph"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted-foreground">Đang dựng graph…</p>,
});

/** `className` đặt chiều cao khung: trang Brain dùng gần cả màn hình, thẻ trên Dashboard thấp hơn. */
export function BrainView({ data, className = "h-[72vh] min-h-96 rounded-2xl" }: { data: GraphData; className?: string }) {
  const empty = data.nodes.every((n) => n.kind === "field");
  return (
    <div className={`relative overflow-hidden border border-line ${className}`}>
      <BrainGraph data={data} />
      {empty && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-sm text-muted-foreground">
          Chưa có trang kiến thức nào. Đồ thị sẽ hiện node khi có kiến thức.
        </p>
      )}
    </div>
  );
}
