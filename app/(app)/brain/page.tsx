import { Suspense } from "react";
import { connection } from "next/server";
import { BrainView } from "@/components/brain/brain-view";
import { PageHeader } from "@/components/page-header";
import { getBrainGraph } from "@/lib/notion/graph";

export default function BrainPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Brain" subtitle="Bản đồ kiến thức và dự án." />
      <Suspense fallback={<div className="h-[72vh] min-h-96 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <BrainContent />
      </Suspense>
    </div>
  );
}

async function BrainContent() {
  await connection(); // không gọi Notion lúc build
  return <BrainView data={await getBrainGraph()} />;
}
