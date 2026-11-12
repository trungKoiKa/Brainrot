import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { KnowledgeBoard } from "@/components/knowledge/knowledge-board";
import { PageHeader } from "@/components/page-header";
import { Readouts } from "@/components/readout";
import { StaleBanner } from "@/components/stale-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, todayVN } from "@/lib/date";
import { getKnowledge, getKnowledgeFields } from "@/lib/db/data";
import { KNOWLEDGE_LEVELS, noteDay } from "@/lib/knowledge";

export const metadata: Metadata = { title: "Knowledge · Brainrot" };

// SPEC.md mục 5.6: "Tôi đã học được gì?" — ghi chú kiến thức theo lĩnh vực, mức hiểu, có liên kết giữa các ghi chú.
export default function KnowledgePage({ searchParams }: PageProps<"/knowledge">) {
  return (
    <>
      <PageHeader kicker="KIẾN THỨC" title="Knowledge" subtitle="Học được gì thì ghi lại một dòng; nối các ghi chú liên quan với nhau." />
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        }
      >
        <KnowledgeContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function KnowledgeContent({ searchParams }: Pick<PageProps<"/knowledge">, "searchParams">) {
  await connection(); // "7 ngày qua" phụ thuộc ngày hôm nay
  const { field, level } = await searchParams;
  const today = todayVN();
  const weekAgo = addDays(today, -6);
  const [{ data, stale }, fields] = await Promise.all([getKnowledge(), getKnowledgeFields()]);

  return (
    <>
      <StaleBanner show={stale} />
      <Readouts
        className="mb-6"
        items={[
          { label: "Ghi chú", value: data.length, note: "tất cả" },
          { label: "7 ngày qua", value: data.filter((n) => noteDay(n) >= weekAgo && noteDay(n) <= today).length, note: "ghi chú mới" },
          { label: "Áp dụng được", value: data.filter((n) => n.level === "Áp dụng được").length, note: "đã dùng được" },
          { label: "Có liên kết", value: data.filter((n) => n.related.length > 0).length, note: "nối với ghi chú khác" },
        ]}
      />
      <KnowledgeBoard
        notes={data}
        fields={fields}
        initialField={typeof field === "string" && field ? field : null}
        initialLevel={KNOWLEDGE_LEVELS.find((l) => l === level) ?? null}
      />
    </>
  );
}
