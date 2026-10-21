import { PageHeader } from "@/components/page-header";

export default function TodayPage() {
  return (
    <PageHeader title="Today" subtitle="Hôm nay làm gì, deadline nào sắp tới, đã học được gì.">
      <p className="text-sm text-muted">Các khối Today sẽ có ở Bước 4.</p>
    </PageHeader>
  );
}
