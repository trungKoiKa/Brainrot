// TẠM THỜI (Bước 3): kiểm tra lớp Notion. Xóa khi xong Bước 4.
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { todayVN } from "@/lib/date";
import { getKnowledge, getRecentDailyLogs, getTasks } from "@/lib/notion/queries";

export default function DebugPage() {
  return (
    <PageHeader title="Debug Notion" subtitle="Trang tạm để đối chiếu dữ liệu với Notion.">
      <Suspense fallback={<p className="text-muted">Đang tải từ Notion…</p>}>
        <DebugData />
      </Suspense>
    </PageHeader>
  );
}

async function DebugData() {
  await connection(); // render lúc request, không prerender lúc build

  const result = await Promise.all([getTasks(), getKnowledge(), getRecentDailyLogs()]).then(
    (data) => ({ data }),
    (e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }),
  );

  if ("error" in result) {
    return (
      <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-danger">
        Lỗi Notion: {result.error}
      </p>
    );
  }

  const [tasks, knowledge, logs] = result.data;
  return (
    <div className="space-y-6 text-sm">
      <p>Hôm nay (giờ VN): <b>{todayVN()}</b></p>
      <Section title={`Tasks: ${tasks.length}`} rows={tasks} />
      <Section title={`Knowledge: ${knowledge.length}`} rows={knowledge} />
      <Section title={`Daily Log (gần nhất): ${logs.length}`} rows={logs} />
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: object[] }) {
  return (
    <section>
      <h2 className="mb-2 font-serif text-lg font-semibold">{title}</h2>
      <pre className="max-h-80 overflow-auto rounded-lg bg-surface-muted p-3 text-xs">
        {JSON.stringify(rows.slice(0, 5), null, 2)}
      </pre>
    </section>
  );
}
