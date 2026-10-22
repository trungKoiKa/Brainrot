"use client";

import dynamic from "next/dynamic";
import type { GraphData } from "@/lib/graph-types";

// three.js chỉ chạy được trên trình duyệt → không render phía server (SPEC 7.3)
const BrainGraph = dynamic(() => import("./brain-graph"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted">Đang dựng graph…</p>,
});

export function BrainView({ data }: { data: GraphData }) {
  return (
    <div className="h-[72vh] min-h-96 overflow-hidden rounded-2xl border border-line">
      <BrainGraph data={data} />
    </div>
  );
}
