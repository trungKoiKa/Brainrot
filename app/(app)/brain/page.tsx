import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { BrainView } from "@/components/brain/brain-view";
import { Card, Empty } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { StaleBanner } from "@/components/stale-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { getBrainGraph } from "@/lib/db/graph";

export const metadata: Metadata = { title: "Brain · Brainrot" };

const linkClass = "font-medium text-primary underline-offset-4 hover:underline";

// SPEC.md mục 10.2: bản đồ 3D nối ghi chú với lĩnh vực, việc chưa xong với dự án, và các ghi chú "liên quan tới" nhau.
export default function BrainPage() {
  return (
    <>
      <PageHeader kicker="BẢN ĐỒ" title="Brain" subtitle="Ghi chú, lĩnh vực, việc và dự án nối với nhau thế nào." />
      <Suspense fallback={<Skeleton className="h-[calc(100dvh-13rem)] min-h-96 rounded-none" />}>
        <BrainContent />
      </Suspense>
    </>
  );
}

async function BrainContent() {
  await connection(); // dữ liệu của người đang đăng nhập
  const { stale, ...graph } = await getBrainGraph();
  // Chưa có gì để vẽ → không tải three.js, chỉ nói rõ và chỉ chỗ thêm
  const empty = !graph.nodes.some((n) => n.kind === "note" || n.kind === "task");

  return (
    <>
      <StaleBanner show={stale} />
      {empty ? (
        <Card>
          <Empty>
            Chưa có ghi chú hay việc chưa xong nào để vẽ.{" "}
            <Link href="/knowledge" className={linkClass}>
              Thêm ghi chú ở Knowledge
            </Link>{" "}
            hoặc{" "}
            <Link href="/tasks" className={linkClass}>
              thêm việc ở Tasks
            </Link>
            .
          </Empty>
        </Card>
      ) : (
        <BrainView data={graph} />
      )}
    </>
  );
}
