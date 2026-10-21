import { Suspense } from "react";
import { connection } from "next/server";
import { BrainView } from "@/components/brain/brain-view";
import { PageHeader } from "@/components/page-header";
import { getBrainGraph } from "@/lib/notion/graph";

export default function BrainPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Suspense
        fallback={
          <>
            <PageHeader title="Brain" subtitle="Đang tải từ Notion…" />
            <div className="h-[70vh] min-h-96 animate-pulse rounded-2xl border border-line bg-surface" />
          </>
        }
      >
        <BrainContent />
      </Suspense>
    </div>
  );
}

async function BrainContent() {
  await connection(); // không gọi Notion lúc build
  const graph = await getBrainGraph();
  return (
    <>
      <PageHeader
        title="Brain"
        subtitle={
          <>
            {graph.nodes.length} node · {graph.links.length} link
            <span className="ml-3 text-xs">Kéo để xoay · cuộn để zoom · bấm node để mở Notion</span>
          </>
        }
      />
      <BrainView data={graph} />
    </>
  );
}
